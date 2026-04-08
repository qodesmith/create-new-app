import {isProd} from '@/server/constants'

import {secureHeaders} from 'hono/secure-headers'

export const secureHeadersMiddleware = secureHeaders({
  // This app should never be embedded in an iframe.
  xFrameOptions: 'DENY',

  /**
   * HSTS (HTTP Strict Transport Security) forces browsers to use HTTPS only.
   * Disabled locally since dev runs over HTTP.
   */
  strictTransportSecurity: isProd
    ? 'max-age=63072000; includeSubDomains'
    : false,
})
