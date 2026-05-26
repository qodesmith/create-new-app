import type {
  AdminAuditLogsMetadata,
  DownloadDatabaseStatus,
} from '@/server/types'

import fs from 'node:fs'
import process from 'node:process'

import {isProd} from '@/server/constants'
import {exportDatabase, getDatabase} from '@/server/db/getDatabase'
import {adminAuditLogsTable, errorsTable} from '@/server/db/schema/appSchema'
import {ratelimits, users, verifications} from '@/server/db/schema/authSchema'
import {purgeStaleRecords} from '@/server/dbCleanup'
import {adminMiddleware} from '@/server/middleware/adminMiddleware'
import {emailVerificationExpiryInMs} from '@/shared/constants'

import {bestEffort, errorToObject, getUnitInMs} from '@qodestack/utils'
import {and, desc, eq, lt, sql} from 'drizzle-orm'
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
                error: errorToObject(streamError, {prettyStack: true}),
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
