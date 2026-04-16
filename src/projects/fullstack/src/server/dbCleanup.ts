import process from 'node:process'

import {isProd} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {ratelimits, users, verifications} from '@/server/db/schema/authSchema'
import {bestEffort} from '@/server/utils/bestEffort'
import {log} from '@/server/utils/logger'
import {emailVerificationExpiryInMs} from '@/shared/constants'

import {getUnitInMs} from '@qodestack/utils'
import {and, eq, lt} from 'drizzle-orm'

const oneHourInMs = getUnitInMs(1, 'h')
let started = false

/**
 * Purges stale data from the database:
 * - Unverified users past the verification window (cascade deletes clean up
 *   accounts, sessions, and passkeys)
 * - Expired verification tokens (sign-up, email change, password reset)
 * - Rate limit entries older than the cleanup interval
 */
function purgeStaleRecords() {
  const db = getDatabase()
  const now = Date.now()

  const cutoff = new Date(now - emailVerificationExpiryInMs)
  const staleUsers = db
    .delete(users)
    .where(and(eq(users.emailVerified, false), lt(users.createdAt, cutoff)))
    .returning()
    .all()

  const expiredVerifications = db
    .delete(verifications)
    .where(lt(verifications.expiresAt, new Date(now)))
    .returning()
    .all()

  const staleRateLimits = db
    .delete(ratelimits)
    .where(lt(ratelimits.lastRequest, now - oneHourInMs))
    .returning()
    .all()

  const total =
    staleUsers.length + expiredVerifications.length + staleRateLimits.length

  if (total > 0) {
    log.text(
      `[DB_CLEANUP] Purged ${staleUsers.length} stale users, ${expiredVerifications.length} expired verifications, ${staleRateLimits.length} stale rate limits`
    )
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

  bestEffort(purgeStaleRecords)
  setInterval(() => bestEffort(purgeStaleRecords), oneHourInMs)
}
