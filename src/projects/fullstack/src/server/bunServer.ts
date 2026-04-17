/** biome-ignore-all lint/correctness/noProcessGlobal: allows Bun to remove conditional code based on process.env.NODE_ENV */

import {$, serve} from 'bun'
import {networkInterfaces} from 'node:os'

import {is0000, isProd, port} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {migrateDbSchema} from '@/server/db/migrate'
import {startDbCleanup} from '@/server/dbCleanup'
import {honoServer} from '@/server/hono/honoServer'
import indexHtml from '@/server/index.html'
import {prodSecurityHeaders} from '@/server/middleware/secureHeadersMiddleware'
import {handleBunServerError} from '@/server/utils/handleBunServerError'
import {log} from '@/server/utils/logger'

import {sql} from 'drizzle-orm'

if (process.env.NODE_ENV === 'production') {
  /**
   * This expects the src/server/db/drizzle folder to be populated with a
   * generated schema. The schema should be checked into version control.
   */
  migrateDbSchema()
}

if (process.env.NODE_ENV === 'development') {
  const db = getDatabase()
  const tables = db.all<{name: string}>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
  )

  // If the development database has no tables, initialize it.
  if (!tables.length) {
    await $`bun run initDevDb.ts`.cwd(process.cwd())
  }
}

// In deployed production, `indexHtml.index` will be a file path.
const prodIndexHtmlContent = isProd
  ? await Bun.file(indexHtml.index).text()
  : null

/**
 * In production, we wrap the response with security headers since Bun's
 * `routes` bypass Hono (and its `secureHeaders` middleware) entirely.
 *
 * In development, we use the plain import to preserve Bun's HMR injection.
 * Security headers in dev are handled by Hono for all non-`/` routes.
 */
const indexHandler = isProd
  ? () =>
      new Response(prodIndexHtmlContent, {
        headers: {
          ...prodSecurityHeaders,
          'Content-Type': 'text/html;charset=utf-8',
        },
      })
  : indexHtml

const bunServer = serve({
  routes: {'/': indexHandler},
  fetch: honoServer.fetch,

  /**
   * Testing on a mobile phone?
   * Set this to '0.0.0.0' and connect via the IP logged at startup.
   */
  hostname: is0000 ? '0.0.0.0' : undefined,
  port,
  error: handleBunServerError,
  idleTimeout: 60, // AI requests can take a long time
  development: isProd // I.e. _deployed_ prod. Everything else is development.
    ? false
    : {
        hmr: true,
        console: false,
        chromeDevToolsAutomaticWorkspaceFolders: true,
      },
})

if (is0000) {
  const interfaces = networkInterfaces()
  const mobileHost = Object.values(interfaces)
    .flat()
    .find(iface => iface?.family === 'IPv4' && !iface.internal)?.address

  if (mobileHost) {
    log.success(`📲 Connect via mobile at http://${mobileHost}:${port}`)
  }
}

log.success(`🚀 Server running at ${bunServer.url.href}`)

startDbCleanup()
