import {serve} from 'bun'
import {networkInterfaces} from 'node:os'

import {is0000, isProd, port} from './constants'
import {migrateDbSchema} from './db/migrate'
import {honoServer} from './hono/honoServer'
import indexHtml from './index.html'
import {handleBunServerError} from './utils/handleBunServerError'
import {log} from './utils/logger'

migrateDbSchema()

const bunServer = serve({
  routes: {'/': indexHtml},
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
