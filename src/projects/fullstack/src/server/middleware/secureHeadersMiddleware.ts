import {isProd} from '@/server/constants'

import {secureHeaders} from 'hono/secure-headers'

const hsts = 'max-age=63072000; includeSubDomains'

export const secureHeadersMiddleware = secureHeaders({
  // This app should never be embedded in an iframe.
  xFrameOptions: 'DENY',

  /**
   * HSTS (HTTP Strict Transport Security) forces browsers to use HTTPS only.
   * Disabled locally since dev runs over HTTP.
   */
  strictTransportSecurity: isProd ? hsts : false,

  /**
   * CSP (Content-Security-Policy) is not enabled by default. It restricts which
   * scripts, styles, and resources the browser will load, making it the single
   * most impactful header against XSS. However, the right policy depends on
   * what your app actually loads — external fonts, analytics scripts, CDN
   * assets, inline styles from UI libraries, etc. A policy that's too strict
   * will silently break your app; one that's too loose provides little value.
   *
   * Uncomment the block below as a starting point and tighten the directives to
   * match your app's needs. See: https://hono.dev/docs/middleware/builtin/secure-headers
   */
  // contentSecurityPolicy: {
  //   defaultSrc: ["'self'"],
  //   scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  //   styleSrc: ["'self'", "'unsafe-inline'"],
  //   imgSrc: ["'self'", 'data:', 'blob:'],
  //   connectSrc: ["'self'"],
  //   fontSrc: ["'self'"],
  //   objectSrc: ["'none'"],
  //   frameAncestors: ["'none'"],
  //   upgradeInsecureRequests: [],
  // },
})

/**
 * https://hono.dev/docs/middleware/builtin/secure-headers
 *
 * Bun's `routes` bypass Hono (and its middleware) entirely. These headers
 * mirror what `secureHeaders` sets so the `/` route has the same protection.
 */
export const prodSecurityHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': hsts,
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '0',
} as const
