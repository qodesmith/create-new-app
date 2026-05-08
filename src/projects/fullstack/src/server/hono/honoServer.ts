import {isProdEnv} from '@/server/constants'
import {auth} from '@/server/db/auth/auth'
import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'
import {adminRoutes} from '@/server/hono/adminRoutes'
import {authRoutes} from '@/server/hono/authRoutes'
import {staticAssetsFromBuildRoutes} from '@/server/hono/staticAssetsFromBuildRoutes'
import indexHtml from '@/server/index.html'
import {corsMiddleware} from '@/server/middleware/corsMiddleware'
import {getRateLimitMiddleware} from '@/server/middleware/rateLimitMiddleware'
import {secureHeadersMiddleware} from '@/server/middleware/secureHeadersMiddleware'
import {captureError} from '@/server/utils/captureError'
import {authRoutePath, betterAuthBasePath} from '@/shared/constants'

import {arktypeValidator} from '@hono/arktype-validator'
import {getUnitInMs} from '@qodestack/utils'
import {createInsertSchema} from 'drizzle-arktype'
import {sql} from 'drizzle-orm'
import {Hono} from 'hono'
import {csrf} from 'hono/csrf'

let indexHtmlString: string | undefined

export type HonoServer = typeof honoServer

export const honoServer = new Hono()
  /////////////////////
  // SECURITY HEADERS //
  /////////////////////

  .use('*', secureHeadersMiddleware)

  //////////
  // AUTH //
  //////////

  .use('/api/*', corsMiddleware) // This needs to be before Better Auth.
  .on(['POST', 'GET'], `${betterAuthBasePath}/*`, async c => {
    try {
      const res = await auth.handler(c.req.raw)

      /**
       * Better Auth normally throws on internal failure (caught below). It can
       * also return 5xx without throwing — capture those rejections so server
       * problems surface in the errors table without a client round-trip.
       * 4xx (wrong password, validation, etc.) is expected UX, not an error.
       */
      if (res.status >= 500) {
        const body = await res.clone().text()
        captureError({
          context: 'betterAuth:topLevel:rejection',
          error: {status: res.status, body, url: c.req.url},
        })
      }

      return res
    } catch (error) {
      captureError({context: 'betterAuth:topLevel:exception', error})
      throw error
    }
  })

  /**
   * Hono's CSRF middleware checks for the presence of the `Origin` header and
   * rejects when that doesn't match the origin of the request. This is fine
   * for both authenticated and unauthenticated routes because they will all be
   * from the same domain.
   *
   * Where this middleware can interfere is for other types of requests that
   * don't set an `Origin` header:
   * - Webhooks
   * - CLI tools
   * - Server-to-server
   */
  .use('/api/*', csrf()) // This needs to be after Better Auth.

  ///////////////////////////////
  // PROTECTED / STATIC ASSETS //
  ///////////////////////////////

  // `.route` keeps these routes from showing in the hc RPC client.
  .route('/', staticAssetsFromBuildRoutes)

  //////////////////
  // HEALTH CHECK //
  //////////////////

  .get(
    '/health',
    getRateLimitMiddleware({windowMs: getUnitInMs(60, 's'), limit: 60}),
    async c => {
      try {
        /**
         * Cheapest possible query — verifies the DB is reachable without
         * touching any tables.
         */
        getDatabase().run(sql`SELECT 1`)
        return c.text('ok')
      } catch {
        return c.text('db unavailable', 503)
      }
    }
  )

  ///////////
  // ADMIN //
  ///////////

  .route('/api/admin', adminRoutes)

  /////////
  // API //
  /////////

  .route(authRoutePath, authRoutes)

  .post(
    '/api/capture',
    // Max 1 capture per second per IP.
    getRateLimitMiddleware({windowMs: getUnitInMs(1, 's'), limit: 1}),
    arktypeValidator(
      'json',
      createInsertSchema(errorsTable).omit(
        'id',
        'createdAt',
        'updatedAt',
        'userId'
      )
    ),
    async c => {
      const {error, context, metadata} = c.req.valid('json')

      /**
       * This route doesn't go through authMiddleware, so we call getSession
       * directly to see if we have an authenticated user to grab their id.
       */
      const session = await auth.api.getSession({headers: c.req.raw.headers})

      captureError({context, error, metadata, userId: session?.user.id})

      return c.body(null)
    }
  )

  ////////////////////////////////
  // NOT FOUND / ERROR HANDLING //
  ////////////////////////////////

  // Return the index.html file contents to let client-side routing take effect.
  .notFound(async c => {
    if (isProdEnv) {
      indexHtmlString ??= await Bun.file(indexHtml.index).text()
      return c.html(indexHtmlString)
    }

    /**
     * IN DEV ONLY...
     *
     * Bun will build all the static assets, including `index.html`, on the fly
     * when `/` is requested. Hono has no access to that build result so we
     * simply make a fetch call to get the text and serve it. This will allow
     * client-side routing to take control. We have to fetch fresh HTML on every
     * request because Bun generates new bundle hashes on each rebuild.
     */
    const homeUrl = new URL(c.req.url).origin
    const res = await fetch(homeUrl)
    return c.html(await res.text())
  })
  .onError((error, c) => {
    captureError({context: 'hono:topLevel:exception', error})

    /**
     * Bun and Hono servers will both return 500 in their error handlers. They
     * can be distinguished on the client by their type:
     * Bun - JSON
     * Hono - Text
     */
    return c.text('Internal server error', 500)
  })
