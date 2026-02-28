import {emailVerificationExpiryInMs} from '@/shared/constants'

import {and, eq, lt} from 'drizzle-orm'
import {Hono} from 'hono'

import {exportDatabase, getDatabase} from '../db/getDatabase'
import {users} from '../db/schema/authSchema'
import {adminMiddleware} from '../middleware/adminMiddleware'

export const adminRoutes = new Hono()
  .use(adminMiddleware)

  /**
   * List unverified users past the verification window.
   */
  .get('/stale-users', c => {
    const db = getDatabase()
    const cutoff = new Date(Date.now() - emailVerificationExpiryInMs)
    const staleUsers = db
      .select({
        id: users.id,
        name: users.name,
        lastName: users.lastName,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.emailVerified, false), lt(users.createdAt, cutoff)))
      .all()

    return c.json({count: staleUsers.length, users: staleUsers})
  })

  /**
   * Manually purge unverified users past the verification window.
   */
  .delete('/stale-users', c => {
    const db = getDatabase()
    const cutoff = new Date(Date.now() - emailVerificationExpiryInMs)
    const result = db
      .delete(users)
      .where(and(eq(users.emailVerified, false), lt(users.createdAt, cutoff)))
      .returning()
      .all()

    return c.json({deleted: result.length})
  })

  /**
   * Download the database for backup.
   */
  .get('/backup-database', _c => {
    const {bunFile, fileName} = exportDatabase()

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
