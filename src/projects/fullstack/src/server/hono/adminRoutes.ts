import {Hono} from 'hono'

import {exportDatabase} from '../db/getDatabase'
import {adminMiddleware} from '../middleware/adminMiddleware'

export const adminRoutes = new Hono()
  .use(adminMiddleware)

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
