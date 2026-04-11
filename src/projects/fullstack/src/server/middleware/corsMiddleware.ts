import {isProd, localOriginList, prodOriginList} from '@/server/constants'

import {cors} from 'hono/cors'
import {createMiddleware} from 'hono/factory'

/**
 * What is a cross-origin request?
 *
 * A cross-origin request is when a web page makes a request to a different
 * origin than the one it was loaded from.
 *
 * What defines an origin?
 * 1. Schema (protocol) - http or https
 * 2. Host (domain)     - example.com vs api.example.com
 * 3. Port              - :80 vs :9001
 */
const corsHandler = cors({
  /**
   * HEADER - Access-Control-Allow-Origin
   * Specifies which origins (domains) are allowed to access the resource.
   *
   * When the client at https://example.com makes a request to
   * https://api.example.com (just as an example), the domain must be found in
   * this array otherwise the browser blocks the request.
   */
  origin: isProd ? prodOriginList : localOriginList,

  /**
   * HEADER - Access-Control-Allow-Methods
   * Lists which HTTP methods are allowed for cross-origin requests.
   *
   * This matters for "non-simple" requests. If your frontend tries to  make a
   * DELETE or PATCH request, the browser first sends a preflight OPTIONS
   * request. If the method isn't in this list, the browser blocks the actual
   * request from ever being sent.
   */
  allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],

  /**
   * HEADER - Access-Control-Allow-Headers
   * Specifies which custom headers the client is allowed to include in the
   * request.
   *
   * For any custom headers, such as X-Custom-Header or Authorization, the
   * browser's preflight check verifies this list. If your header isn't listed,
   * the request fails. You must explicitly list any custom headers your API
   * expects.
   */
  allowHeaders: [],

  /**
   * HEADER - Access-Control-Max-Age
   * Tells the browser how long (in seconds) to cache the preflight response
   * (OPTIONS).
   *
   * By default, the browser sends a preflight OPTIONS request before every
   * non-simple request - adding latency. This setting allows the browser to
   * cache the preflight result for a duration so subsequent requests skip the
   * preflight. This is a performance optimization.
   *
   * What is a non-simple request?
   * - HTTP methods other than GET, HEAD, or POST
   * - Custom headers like Authorization, X-Custom-Header, etc.
   * - Content-Type values other than application/x-www-form-urlencoded,
   *   multipart/form-data, or text/plain
   */
  maxAge: 600,

  /**
   * HEADER - Access-Control-Allow-Credentials
   * Indicates whether the browser should include credentials (cookies,
   * HTTP auth, client-side SSL certificates) with cross-origin requests.
   *
   * If your API uses session cookies for authentication, this needs to be true.
   * We're using Better-Auth for authentication which does use cookies for
   * authentication.
   */
  credentials: true,

  /**
   * HEADER - Access-Control-Expose-Headers
   * Lists which response headers the browser should expose to the frontend
   * JavaScript.
   *
   * By default, only a handful of "CORS-safelisted" response headers are
   * accessible to JavaScript (like Content-Type). If your API returns useful
   * information in custom headers—say, X-Total-Count for pagination or
   * X-RateLimit-Remaining—you must list them here, or the frontend code simply
   * cannot read them even though they're in the response.
   */
  exposeHeaders: [],
})

export const corsMiddleware = createMiddleware(async (c, next) => {
  return corsHandler(c, next)
})
