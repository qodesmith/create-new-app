import process from 'node:process'

import {isProd} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {ratelimits, users, verifications} from '@/server/db/schema/authSchema'
import {bestEffort} from '@/server/utils/bestEffort'
import {log} from '@/server/utils/logger'
import {emailVerificationExpiryInMs} from '@/shared/constants'

import {getUnitInMs} from '@qodestack/utils'
import {and, eq, lt} from 'drizzle-orm'

const reaperIntervalMs = getUnitInMs(1, 'h')

function reap() {
  const db = getDatabase()
  const now = Date.now()

  /**
   * Unverified users past the verification window. Cascade deletes clean up
   * accounts, sessions, and passkeys.
   */
  const cutoff = new Date(now - emailVerificationExpiryInMs)
  const staleUsers = db
    .delete(users)
    .where(and(eq(users.emailVerified, false), lt(users.createdAt, cutoff)))
    .returning()
    .all()

  // Expired verification tokens (sign-up, email change, password reset).
  const expiredVerifications = db
    .delete(verifications)
    .where(lt(verifications.expiresAt, new Date(now)))
    .returning()
    .all()

  // Stale rate limit entries.
  const staleRateLimits = db
    .delete(ratelimits)
    .where(lt(ratelimits.lastRequest, now - reaperIntervalMs))
    .returning()
    .all()

  const total =
    staleUsers.length + expiredVerifications.length + staleRateLimits.length

  if (total > 0) {
    log.text(
      `[REAPER] Purged ${staleUsers.length} stale users, ${expiredVerifications.length} expired verifications, ${staleRateLimits.length} stale rate limits`
    )
  }
}

export function startReaper() {
  if (isProd) {
    const args = process.argv.slice(2)
    const isPrimary = args.includes('--is-primary')

    if (!isPrimary) {
      log.text('Skipping reaper on non-primary node')
      return
    }
  }

  bestEffort(reap)
  setInterval(() => bestEffort(reap), reaperIntervalMs)
}
