import type {
  AdminAuditLogsMetadata,
  DownloadDatabaseStatus,
} from '@/server/types'

import fs from 'node:fs'
import process from 'node:process'

import {isProd} from '@/server/constants'
import {exportDatabase, getDatabase} from '@/server/db/getDatabase'
import {
  adminAuditLogsTable,
  avatarsTable,
  errorsTable,
  systemAuditLogsTable,
} from '@/server/db/schema/appSchema'
import {ratelimits, users, verifications} from '@/server/db/schema/authSchema'
import {purgeStaleRecords} from '@/server/dbCleanup'
import {adminMiddleware} from '@/server/middleware/adminMiddleware'
import {
  adminAuditLogActions,
  emailVerificationExpiryInMs,
  systemAuditLogActions,
} from '@/shared/constants'

import {arktypeValidator} from '@hono/arktype-validator'
import {bestEffort, errorToObject, getUnitInMs} from '@qodestack/utils'
import {type} from 'arktype'
import {and, asc, count, desc, eq, lt, sql} from 'drizzle-orm'
import {Hono} from 'hono'

export type HonoAdminServer = typeof adminRoutes

export const adminRoutes = new Hono()
  .use(adminMiddleware)

  /**
   * List unverified users past the verification window.
   */
  .get('/stale-records', c => {
    const db = getDatabase()
    const now = Date.now()
    const oneHourInMs = getUnitInMs(1, 'h')
    const cutoff = new Date(now - emailVerificationExpiryInMs)

    const staleUsers = db
      .select()
      .from(users)
      .where(and(eq(users.emailVerified, false), lt(users.createdAt, cutoff)))
      .all()
    const staleVerifications = db
      .select()
      .from(verifications)
      .where(lt(verifications.expiresAt, new Date(now)))
      .all()
    const staleRatelimits = db
      .select()
      .from(ratelimits)
      .where(lt(ratelimits.lastRequest, now - oneHourInMs))
      .all()

    return c.json({staleUsers, staleVerifications, staleRatelimits})
  })

  /**
   * Manually purge stale records.
   */
  .delete('/stale-records', c => {
    const user = c.get('user')

    try {
      return c.json(purgeStaleRecords({adminId: user.id}))
    } catch (err) {
      bestEffort(() => {
        getDatabase()
          .insert(errorsTable)
          .values({
            error: errorToObject(err),
            context: 'dbCleanup:purgeStaleRecords:exception',
            userId: user.id,
          })
          .run()
      })

      return c.json({error: 'Failed to purge stale records'}, 500)
    }
  })

  /**
   * Surfaces three timestamps to the admin UI:
   *   - `lastBackup`: `updatedAt` of the newest `status: 'complete'` row,
   *     i.e. when the most recent successful stream finished.
   *   - `inProgressSince`: `createdAt` of the newest `status: 'started'`
   *     row, i.e. when an in-flight download began. Used to render a
   *     "backup in progress" indicator while a long stream is running,
   *     since the client has no other way to observe the stream's state.
   *   - `lastFailureAt`: `updatedAt` of the newest `status: 'fail'` row,
   *     but only if it's newer than `lastBackup`. A subsequent successful
   *     backup supersedes any prior failure — we only flag a failure when
   *     it represents the user's most recent outcome.
   */
  .get('/last-backup', c => {
    const db = getDatabase()
    const action: AdminAuditLogsMetadata['action'] = 'download-database'
    const completeStatus: DownloadDatabaseStatus = 'complete'
    const startedStatus: DownloadDatabaseStatus = 'started'
    const failStatus: DownloadDatabaseStatus = 'fail'
    const actionPredicate = sql`${adminAuditLogsTable.metadata} ->> 'action' = ${action}`

    const lastComplete = db
      .select({updatedAt: adminAuditLogsTable.updatedAt})
      .from(adminAuditLogsTable)
      .where(
        and(
          actionPredicate,
          sql`${adminAuditLogsTable.metadata} ->> 'status' = ${completeStatus}`
        )
      )
      .orderBy(desc(adminAuditLogsTable.updatedAt))
      .limit(1)
      .get()

    const inProgress = db
      .select({createdAt: adminAuditLogsTable.createdAt})
      .from(adminAuditLogsTable)
      .where(
        and(
          actionPredicate,
          sql`${adminAuditLogsTable.metadata} ->> 'status' = ${startedStatus}`
        )
      )
      .orderBy(desc(adminAuditLogsTable.createdAt))
      .limit(1)
      .get()

    const lastFail = db
      .select({updatedAt: adminAuditLogsTable.updatedAt})
      .from(adminAuditLogsTable)
      .where(
        and(
          actionPredicate,
          sql`${adminAuditLogsTable.metadata} ->> 'status' = ${failStatus}`
        )
      )
      .orderBy(desc(adminAuditLogsTable.updatedAt))
      .limit(1)
      .get()

    const lastCompleteMs = lastComplete?.updatedAt.getTime() ?? 0
    const lastFailMs = lastFail?.updatedAt.getTime() ?? 0
    const lastFailureAt =
      lastFail && lastFailMs > lastCompleteMs
        ? lastFail.updatedAt.toISOString()
        : null

    return c.json({
      lastBackup: lastComplete?.updatedAt.toISOString() ?? null,
      inProgressSince: inProgress?.createdAt.toISOString() ?? null,
      lastFailureAt,
    })
  })

  /**
   * Stream a gzipped SQLite snapshot. The snapshot is taken via VACUUM INTO
   * into the OS temp dir, then piped through gzip on the way out. The temp
   * file is unlinked whether the stream completes, errors, or is cancelled.
   *
   * Audit-log lifecycle:
   *   1. Insert a `status: 'started'` row before doing any work.
   *   2. On successful stream finalize, UPDATE that row to `'complete'`
   *      (`updatedAt` becomes the completion time).
   *   3. On any failure path (stream error, client cancel, pre-stream
   *      exception), UPDATE the same row to `'fail'`.
   *   4. If the process dies before either branch runs, the boot-time
   *      reaper in `dbCleanup.ts` flips the orphan to `'fail'`.
   */
  .get('/backup-database', c => {
    /**
     * On Fly + LiteFS, replicas are read-only at the SQLite level. Mirror the
     * `--is-primary` gate from `dbCleanup.ts` so we only run this on the
     * primary. In dev, no flag is set, so the gate is a no-op.
     */
    if (isProd) {
      const isPrimary = process.argv.slice(2).includes('--is-primary')

      if (!isPrimary) {
        return c.json(
          {error: 'Backup is only available on the primary node'},
          503
        )
      }
    }

    const db = getDatabase()
    const user = c.get('user')

    const auditRow = db
      .insert(adminAuditLogsTable)
      .values({
        userId: user.id,
        metadata: {action: 'download-database', status: 'started'},
      })
      .returning({id: adminAuditLogsTable.id})
      .get()
    const auditRowId = auditRow.id

    const setAuditStatus = (
      status: Exclude<DownloadDatabaseStatus, 'started'>
    ) => {
      bestEffort(() => {
        db.update(adminAuditLogsTable)
          .set({metadata: {action: 'download-database', status}})
          .where(eq(adminAuditLogsTable.id, auditRowId))
          .run()
      })
    }

    let sqliteBackupPath: string

    try {
      const result = exportDatabase()
      sqliteBackupPath = result.sqliteBackupPath
      const {downloadName} = result

      const reader = Bun.file(sqliteBackupPath)
        .stream()
        .pipeThrough(new CompressionStream('gzip'))
        .getReader()

      let finalized = false
      const finalize = (succeeded: boolean, streamError?: unknown) => {
        if (finalized) return
        finalized = true

        bestEffort(
          () => {
            if (sqliteBackupPath) {
              fs.unlinkSync(sqliteBackupPath)
            }
          },
          {log: true}
        )

        setAuditStatus(succeeded ? 'complete' : 'fail')

        if (!succeeded && streamError) {
          /**
           * Mid-stream failures surface to the client as a truncated download.
           * Log here so there's a server-side trace of what went wrong.
           */
          bestEffort(() => {
            db.insert(errorsTable)
              .values({
                error: errorToObject(streamError),
                context: 'db:backupStream:exception',
                userId: user.id,
              })
              .run()
          })
        }
      }

      const responseStream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const {done, value} = await reader.read()

            if (done) {
              controller.close()
              finalize(true)
            } else {
              controller.enqueue(value)
            }
          } catch (err) {
            controller.error(err)
            finalize(false, err)
          }
        },
        cancel(reason) {
          void reader.cancel(reason).catch(() => {})
          finalize(false)
        },
      })

      return new Response(responseStream, {
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          pragma: 'no-cache',
          expires: '0',
        },
      })
    } catch (err) {
      bestEffort(() => {
        if (sqliteBackupPath) {
          fs.unlinkSync(sqliteBackupPath)
        }
      })

      // Snapshot/setup threw before the stream was constructed. The row
      // would otherwise stay 'started' until the next boot reaper run.
      setAuditStatus('fail')

      bestEffort(() => {
        db.insert(errorsTable)
          .values({
            error: errorToObject(err),
            context: 'db:backupSnapshot:exception',
            userId: user.id,
          })
          .run()
      })

      return c.json({error: 'Failed to start backup'}, 500)
    }
  })

  /**
   * Paginated, sortable, filterable admin audit log. Query params arrive as
   * strings, so numerics are coerced via arktype morphs. Each row is joined to
   * its acting user (inner join — `userId` is `notNull` with an `onDelete:
   * 'cascade'` FK, so an audit row can never outlive its user).
   */
  .get(
    '/admin-audit-logs',
    arktypeValidator(
      'query',
      type({
        // Query params arrive as strings, so coerce numerics with morphs.
        'page?': type('string.integer.parse').to('number >= 1'),
        'pageSize?': type("'10' | '25' | '50'").pipe(Number),
        'sortBy?': "'createdAt' | 'action'",
        'sortDirection?': "'asc' | 'desc'",
        'action?': type.enumerated(...adminAuditLogActions),
      })
    ),
    c => {
      const db = getDatabase()
      const {
        page = 1,
        pageSize = 25,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        action,
      } = c.req.valid('query')

      // Optional filter on the JSON `action` field via SQLite's `->>` operator.
      const where = action
        ? sql`${adminAuditLogsTable.metadata} ->> 'action' = ${action}`
        : undefined

      // Sorting by `action` reaches into the JSON metadata column.
      const sortColumn =
        sortBy === 'action'
          ? sql`${adminAuditLogsTable.metadata} ->> 'action'`
          : adminAuditLogsTable.createdAt
      const orderBy =
        sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn)

      const logs = db
        .select({
          id: adminAuditLogsTable.id,
          createdAt: adminAuditLogsTable.createdAt,
          metadata: adminAuditLogsTable.metadata,
          user: users,
        })
        .from(adminAuditLogsTable)
        .innerJoin(users, eq(adminAuditLogsTable.userId, users.id))
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

      const total =
        db.select({value: count()}).from(adminAuditLogsTable).where(where).get()
          ?.value ?? 0

      return c.json({logs, total})
    }
  )

  /**
   * Paginated, sortable, filterable system audit log. Same shape as the admin
   * audit log but without an acting user (these rows have no `userId`).
   */
  .get(
    '/system-audit-logs',
    arktypeValidator(
      'query',
      type({
        // Query params arrive as strings, so coerce numerics with morphs.
        'page?': type('string.integer.parse').to('number >= 1'),
        'pageSize?': type("'10' | '25' | '50'").pipe(Number),
        'sortBy?': "'createdAt' | 'action'",
        'sortDirection?': "'asc' | 'desc'",
        'action?': type.enumerated(...systemAuditLogActions),
      })
    ),
    c => {
      const db = getDatabase()
      const {
        page = 1,
        pageSize = 25,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        action,
      } = c.req.valid('query')

      const where = action
        ? sql`${systemAuditLogsTable.metadata} ->> 'action' = ${action}`
        : undefined

      const sortColumn =
        sortBy === 'action'
          ? sql`${systemAuditLogsTable.metadata} ->> 'action'`
          : systemAuditLogsTable.createdAt
      const orderBy =
        sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn)

      const logs = db
        .select({
          id: systemAuditLogsTable.id,
          createdAt: systemAuditLogsTable.createdAt,
          metadata: systemAuditLogsTable.metadata,
        })
        .from(systemAuditLogsTable)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

      const total =
        db
          .select({value: count()})
          .from(systemAuditLogsTable)
          .where(where)
          .get()?.value ?? 0

      return c.json({logs, total})
    }
  )

  /**
   * Serve an arbitrary user's avatar by id. Mirrors the authenticated avatar
   * GET handler: weak ETag from `updatedAt`, 304 on revalidation, no-cache.
   */
  .get('/avatar/:userId', c => {
    const db = getDatabase()
    const {userId} = c.req.param()
    const avatar = db
      .select()
      .from(avatarsTable)
      .where(eq(avatarsTable.userId, userId))
      .get()

    if (!avatar) {
      return c.body(null, 404)
    }

    const etag = `W/"${avatar.updatedAt.getTime()}"`

    // Weak validator the browser echoes back as `If-None-Match` on revalidation.
    c.header('ETag', etag)

    /**
     * Force revalidation on every request but allow 304 responses, so a new
     * upload is seen immediately instead of being masked by a stale cache.
     */
    c.header('Cache-Control', 'private, no-cache')

    // If the client's cached ETag still matches, skip sending the image bytes.
    if (c.req.header('If-None-Match') === etag) {
      return c.body(null, 304)
    }

    c.header('Content-Type', avatar.mimeType)
    return c.body(new Uint8Array(avatar.data))
  })
