import {$, serve} from 'bun'

import {is0000, isProd, port} from '@/server/constants'

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
   * 1. Set this value to '0.0.0.0'
   * 2. Get your Mac's IP address:
   *   - ipconfig getifaddr en0 (for wifi)
   *   - ipconfig getifaddr en1 (for ethernet)
   * 3. URL on phone - <ip address>:<port>
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
  const wifiIp = await $`ipconfig getifaddr en0`.quiet().nothrow().text()
  const ethIp = await $`ipconfig getifaddr en1`.quiet().nothrow().text()
  let mobileHost = ''

  if (wifiIp) {
    mobileHost = wifiIp.trim()
  } else if (ethIp) {
    mobileHost = ethIp.trim()
  }

  if (mobileHost) {
    log.success(`📲 Connect via mobile at http://${mobileHost}:${port}`)
  }
}

log.success(`🚀 Server running at ${bunServer.url.href}`)
