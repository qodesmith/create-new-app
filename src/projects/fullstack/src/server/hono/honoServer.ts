import {isProd} from '@/server/constants'
import {auth} from '@/server/db/auth/auth'
import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'
import {adminRoutes} from '@/server/hono/adminRoutes'
import {authRoutes} from '@/server/hono/authRoutes'
import {staticAssetsFromBuildRoutes} from '@/server/hono/staticAssetsFromBuildRoutes'
import {corsMiddleware} from '@/server/middleware/corsMiddleware'
import {getRateLimitMiddleware} from '@/server/middleware/rateLimitMiddleware'
import {bestEffort} from '@/server/utils/bestEffort'
import {log} from '@/server/utils/logger'
import {authRoutePath, betterAuthBasePath} from '@/shared/constants'

import {arktypeValidator} from '@hono/arktype-validator'
import {errorToObject, getUnitInMs} from '@qodestack/utils'
import {createInsertSchema} from 'drizzle-arktype'
import {Hono} from 'hono'
import {csrf} from 'hono/csrf'

export type HonoServer = typeof honoServer

export const honoServer = new Hono()
  //////////
  // AUTH //
  //////////

  .use('/api/*', corsMiddleware) // This needs to be before Better Auth.
  .on(['POST', 'GET'], `${betterAuthBasePath}/*`, async c => {
    try {
      const res = await auth.handler(c.req.raw)
      return res
    } catch (error) {
      const db = getDatabase()

      if (isProd) {
        bestEffort(() => {
          db.insert(errorsTable)
            .values({
              error: errorToObject(error),
              location: 'hono',
              context: 'hono:betterAuth',
            })
            .run()
        })
      } else {
        log.error('[BETTER AUTH]', errorToObject(error))
      }

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

  .get('/health', async c => c.text('ok'))

  ///////////
  // ADMIN //
  ///////////

  .route('/api/admin', adminRoutes)

  /////////
  // API //
  /////////

  .route(authRoutePath, authRoutes)

  .post(
    '/api/client-error',
    // Max 5 errors per second.
    getRateLimitMiddleware({windowMs: getUnitInMs(1, 's'), limit: 5}),
    arktypeValidator(
      'json',
      createInsertSchema(errorsTable).omit(
        'location',
        'id',
        'createdAt',
        'updatedAt',
        'userId'
      )
    ),
    async c => {
      const db = getDatabase()
      const {error, context, metadata} = c.req.valid('json')

      // Check if user is authenticated and use their ID instead of client-provided userId
      const session = await auth.api.getSession({headers: c.req.raw.headers})
      const userId = session?.user?.id

      bestEffort(() => {
        db.insert(errorsTable)
          .values({location: 'client', error, context, userId, metadata})
          .run()
      })

      return c.body(null)
    }
  )

  ////////////////////////////////
  // NOT FOUND / ERROR HANDLING //
  ////////////////////////////////

  /**
   * In production we simply return the `index.html` file to allow client-side
   * routing to take control.
   *
   * Bun will build all the static assets, including the `index.html` file, on
   * the fly when the `/` route is requested. That build result is inaccessible
   * to Hono so we simply make a fetch call to get the text and serve it. This
   * will allow client-side routing to take control.
   */
  .notFound(async c => {
    const homeUrl = new URL(c.req.url).origin
    const res = await fetch(homeUrl)
    const html = await res.text()

    return c.html(html)
  })
  .onError((error, c) => {
    const db = getDatabase()

    bestEffort(() => {
      db.insert(errorsTable)
        .values({
          error: errorToObject(error),
          location: 'hono',
          context: 'hono:topLevel',
        })
        .run()
    })

    /**
     * Bun and Hono servers will both return 500 in their error handlers. They
     * can be distinguished on the client by their type:
     * Bun - JSON
     * Hono - Text
     */
    return c.text('Internal server error', 500)
  })
