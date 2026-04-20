import type {AuthSchemaSelect, SharedAuditLogsMetadata} from '@/server/types'

import process from 'node:process'

import {errorRetentionPeriod, isProd, userRoles} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {
  adminAuditLogsTable,
  errorsTable,
  systemAuditLogsTable,
} from '@/server/db/schema/appSchema'
import {ratelimits, users, verifications} from '@/server/db/schema/authSchema'
import {log} from '@/server/utils/logger'
import {emailVerificationExpiryInMs} from '@/shared/constants'

import {
  bestEffort,
  errorToObject,
  getUnitInMs,
  pluralize,
} from '@qodestack/utils'
import {and, eq, lt} from 'drizzle-orm'

const oneHourInMs = getUnitInMs(1, 'h')
let started = false

/**
 * Purges stale data from the database:
 * - Unverified users past the verification window (cascade deletes clean up
 *   accounts, sessions, and passkeys)
 * - Expired verification tokens (sign-up, email change, password reset)
 * - Rate limit entries older than the cleanup interval
 * - Errors older than the retention period
 */
export function purgeStaleRecords({
  purgeUsers = true,
  purgeVerifications = true,
  purgeRatelimits = true,
  purgeErrors = true,
  ...opts
}: ({adminId: AuthSchemaSelect['users']['id']} | {system: true}) & {
  purgeUsers?: boolean
  purgeVerifications?: boolean
  purgeRatelimits?: boolean
  purgeErrors?: boolean
}): {
  usersPurged: number
  verificationsPurged: number
  ratelimitsPurged: number
  errorsPurged: number
  message?: string
} {
  const db = getDatabase()
  const isAdmin = 'adminId' in opts
  const nothingPurged = {
    usersPurged: 0,
    verificationsPurged: 0,
    ratelimitsPurged: 0,
    errorsPurged: 0,
  }

  // Sanity check, though this should never happen.
  if (!(isAdmin || opts.system)) {
    const errorMsg = 'Refusing to purge stale records - unknown actor'
    log.error(errorMsg)

    bestEffort(() => {
      db.insert(errorsTable)
        .values({
          error: errorToObject(new Error(errorMsg)),
          context: 'dbCleanup:purgeStaleRecordsException',
        })
        .run()
    })

    return {...nothingPurged, message: errorMsg}
  }

  // Verify admin user.
  if (isAdmin) {
    const {adminId} = opts
    const adminUser = db
      .select()
      .from(users)
      .where(and(eq(users.id, adminId), eq(users.role, userRoles.admin)))
      .get()

    if (!adminUser) {
      const errorMsg = `Refusing to purge stale records - admin user not found for id '${adminId}'`
      log.error(errorMsg)

      bestEffort(() => {
        db.insert(errorsTable).values({
          error: errorToObject(new Error(errorMsg)),
          context: 'dbCleanup:purgeStaleRecordsException',
        })
      })

      return {...nothingPurged, message: errorMsg}
    }
  }

  const now = Date.now()
  const staleUsersCuroff = new Date(now - emailVerificationExpiryInMs)

  const usersPurgedResults = purgeUsers
    ? db.transaction(tx => {
        const deleted = tx
          .delete(users)
          .where(
            and(
              eq(users.emailVerified, false),
              lt(users.createdAt, staleUsersCuroff)
            )
          )
          .returning()
          .all()

        const metadata: SharedAuditLogsMetadata = {
          action: 'purge-stale-users',
          deletedCount: deleted.length,
        }

        if (isAdmin) {
          tx.insert(adminAuditLogsTable)
            .values({userId: opts.adminId, metadata})
            .run()
        } else {
          tx.insert(systemAuditLogsTable).values({metadata}).run()
        }

        return deleted
      })
    : []

  const verificationsPurgedResults = purgeVerifications
    ? db.transaction(tx => {
        const deleted = tx
          .delete(verifications)
          .where(lt(verifications.expiresAt, new Date(now)))
          .returning()
          .all()

        const metadata: SharedAuditLogsMetadata = {
          action: 'purge-expired-verifications',
          deletedCount: deleted.length,
        }

        if (isAdmin) {
          tx.insert(adminAuditLogsTable)
            .values({userId: opts.adminId, metadata})
            .run()
        } else {
          tx.insert(systemAuditLogsTable).values({metadata})
        }

        return deleted
      })
    : []

  const ratelimitsPurgedResults = purgeRatelimits
    ? db.transaction(tx => {
        const deleted = tx
          .delete(ratelimits)
          .where(lt(ratelimits.lastRequest, now - oneHourInMs))
          .returning()
          .all()

        const metadata: SharedAuditLogsMetadata = {
          action: 'purge-stale-ratelimits',
          deletedCount: deleted.length,
        }

        if (isAdmin) {
          tx.insert(adminAuditLogsTable)
            .values({userId: opts.adminId, metadata})
            .run()
        } else {
          tx.insert(systemAuditLogsTable).values({metadata})
        }

        return deleted
      })
    : []

  const errorsPurgedResults = purgeErrors
    ? db.transaction(tx => {
        const deleted = tx
          .delete(errorsTable)
          .where(
            lt(errorsTable.createdAt, new Date(now - errorRetentionPeriod))
          )
          .returning()
          .all()

        const metadata: SharedAuditLogsMetadata = {
          action: 'purge-stale-errors',
          deletedCount: deleted.length,
        }

        if (isAdmin) {
          tx.insert(adminAuditLogsTable)
            .values({userId: opts.adminId, metadata})
            .run()
        } else {
          tx.insert(systemAuditLogsTable).values({metadata})
        }

        return deleted
      })
    : []

  const total =
    usersPurgedResults.length +
    verificationsPurgedResults.length +
    ratelimitsPurgedResults.length

  if (total > 0) {
    const actor = isAdmin ? 'admin' : 'system'
    const userResults = pluralize(usersPurgedResults.length, 'stale user')
    const verificationResults = pluralize(
      verificationsPurgedResults.length,
      'expired verification'
    )
    const rateLimitResults = pluralize(
      ratelimitsPurgedResults.length,
      'stale rate limit'
    )

    log.text(
      `[DB_CLEANUP][${actor}] Purged ${userResults}, ${verificationResults} , ${rateLimitResults}`
    )
  }

  return {
    usersPurged: usersPurgedResults.length,
    verificationsPurged: verificationsPurgedResults.length,
    ratelimitsPurged: ratelimitsPurgedResults.length,
    errorsPurged: errorsPurgedResults.length,
  }
}

/**
 * Starts a recurring background job that purges stale database records every
 * hour. In production, only runs on the primary node (started with
 * `--is-primary`) to avoid duplicate work across replicas.
 */
export function startDbCleanup() {
  if (started) return
  started = true

  if (isProd) {
    const args = process.argv.slice(2)
    const isPrimary = args.includes('--is-primary')

    if (!isPrimary) {
      log.text('Skipping database cleanup on non-primary node')
      return
    }
  }

  const systemPurge = () => purgeStaleRecords({system: true})

  bestEffort(systemPurge, {log: true})
  setInterval(() => bestEffort(systemPurge, {log: true}), oneHourInMs)
}
