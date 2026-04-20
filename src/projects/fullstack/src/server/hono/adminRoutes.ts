import type {SessionData} from '@/server/db/auth/auth'

import {exportDatabase, getDatabase} from '@/server/db/getDatabase'
import {adminAuditLogsTable} from '@/server/db/schema/appSchema'
import {ratelimits, users, verifications} from '@/server/db/schema/authSchema'
import {purgeStaleRecords} from '@/server/dbCleanup'
import {adminMiddleware} from '@/server/middleware/adminMiddleware'
import {emailVerificationExpiryInMs} from '@/shared/constants'

import {getUnitInMs} from '@qodestack/utils'
import {and, eq, lt} from 'drizzle-orm'
import {Hono} from 'hono'

// biome-ignore lint/style/useNamingConvention: Hono uses `Variables`
export const adminRoutes = new Hono<{Variables: SessionData}>()
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
    return c.json(purgeStaleRecords({adminId: user.id}))
  })

  /**
   * Download the database for backup.
   */
  .get('/backup-database', c => {
    const db = getDatabase()
    const user = c.get('user')
    const {bunFile, fileName} = exportDatabase()

    db.insert(adminAuditLogsTable)
      .values({userId: user.id, metadata: {action: 'download-database'}})
      .run()

    return new Response(bunFile, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': bunFile.size.toString(),

        /**
         * `no-store`
         * Instructs the cache never to store any part of the client's request
         * or the server's response.
         *
         * `no-cache`
         * This directive does not mean "don't cache." Instead, it means that a
         * cached copy must be revalidated with the origin server before it can
         * be used, even if the cache is considered fresh.
         *
         * `must-revalidate`
         * This directive applies only after the cached response becomes stale.
         * It tells the cache that it must check with the origin server for a
         * new response (revalidate) and must not serve the stale version if the
         * server is unreachable.
         */
        'Cache-Control': 'no-store, no-cache, must-revalidate',

        /**
         * This is a legacy header equivalent to Cache-Control: no-cache. It is
         * still included in responses primarily for backward compatibility with
         * older clients or proxy servers that might not fully support the
         * Cache-Control header.
         */
        pragma: 'no-cache',

        // Another legacy header meaning the resource is immediately stale.
        expires: '0',
      },
    })
  })
