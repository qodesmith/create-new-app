import {getEnvVar} from '@/server/utils/getEnvVar'

import {safeJsonParse} from '@qodestack/utils'
import {createMiddleware} from 'hono/factory'

/**
 * This middleware aims at preventing direct access to assets, such as images,
 * audio, and video. We want the server to serve these assets when the site
 * requests them, but not when their urls are directly input into the browser.
 *
 * NOTE: does not work locally on 0.0.0.0 - localhost works just fine.
 *
 * ✅ - Use this on a per-route basis:
 * ```typescript
 * .get('/my-route', noDirectRequestMiddleware, () => {...})
 * ```
 *
 * 🚫 - Do **NOT** use this with Hono's `.use(noDirectRequestMiddleware)`. It
 * will cause _all_ requests to be processed through this middleware.
 */
export const noDirectRequestMiddleware = createMiddleware(async (c, next) => {
  const directRequestHeaders = safeJsonParse<[string, string][]>(
    // Providing your own headers via env var will override the default value.
    getEnvVar('DIRECT_REQUEST_HEADERS', {shouldThrow: false}),

    // Default value.
    [
      ['sec-fetch-mode', 'navigate'],
      ['sec-fetch-dest', 'document'],
    ]
  )
  const shouldBlockRequest = directRequestHeaders.some(([header, value]) => {
    return c.req.header(header) === value
  })

  if (shouldBlockRequest) {
    /**
     * Original size - 640 x 342
     *
     * 1. max-width:100vw         - prevents horizontal overflow (100% of viewport width)
     * 2. max-height:100vh        - prevents vertical overflow (100% of viewport height)
     * 3. width:100%; height:100% - makes the video try to fill available space
     * 4. object-fit:contain      - maintains aspect ratio while fitting within the constraints
     */
    const html = `
      <body style="height:100%;background:#000;color:#fff;display:grid;place-items:center;margin:0;">
        <video autoplay muted loop style="max-width:100vw;max-height:100vh;width:100%;height:100%;object-fit:contain;">
          <source src="/forbidden.webm" type="video/webm">
          Please don't link directly to these assets.
        </video>
      </body>
    `
    c.res = new Response(html, {
      status: 403,
      headers: {'Content-Type': 'text/html'},
    })
  } else {
    await next()
  }
})
