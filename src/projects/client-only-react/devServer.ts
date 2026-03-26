// biome-ignore-all lint/suspicious/noConsole: it's ok here

import {serve} from 'bun'
import {networkInterfaces} from 'node:os'
import process from 'node:process'

import indexHtml from './index.html'

const port = process.env.PORT ?? 9001
const is0000 = process.env.ALL_CONNECTIONS === 'true'
const isProd = process.env.NODE_ENV === 'production'

const devServer = serve({
  routes: {'/': indexHtml},

  /**
   * SPA fallback - any request that isn't a static file gets index.html.
   * Bun automatically serves static assets found via the index.html import.
   */
  fetch() {
    return new Response(Bun.file(indexHtml))
  },

  hostname: is0000 ? '0.0.0.0' : undefined,
  port,
  development: isProd
    ? false
    : {
        hmr: true,
        console: false,
      },
})

if (is0000) {
  const interfaces = networkInterfaces()
  const mobileHost = Object.values(interfaces)
    .flat()
    .find(iface => iface?.family === 'IPv4' && !iface.internal)?.address

  if (mobileHost) {
    console.log(`Connect via mobile at http://${mobileHost}:${port}`)
  }
}

console.log(`Server running at ${devServer.url.href}`)
