import type {MiddlewareHandler} from 'hono'

import {isProd} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'
import {bestEffort} from '@/server/utils/bestEffort'

import {getUnitInMs} from '@qodestack/utils'
import {getConnInfo} from 'hono/bun'
import {rateLimiter} from 'hono-rate-limiter'

export function getRateLimitMiddleware({
  windowMs = getUnitInMs(1, 'h'), // 1 hour
  limit = 10, // 10 requests per hour per IP
  logUnknownError = true,
} = {}): MiddlewareHandler {
  const devMiddleware: MiddlewareHandler = (_c, next) => next()

  return isProd
    ? rateLimiter({
        windowMs,
        limit,
        standardHeaders: 'draft-6',
        keyGenerator: c => {
          const info = getConnInfo(c)

          /**
           * Proxy-set headers are checked first because in production
           * `remote.address` is typically the proxy's IP, not the client's.
           */
          const ipAddress =
            c.req.header('cf-connecting-ip') ||
            c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
            c.req.header('x-real-ip') ||
            info.remote.address ||
            'unknown'

          if (ipAddress === 'unknown' && logUnknownError) {
            const db = getDatabase()

            bestEffort(() => {
              db.insert(errorsTable)
                .values({
                  context: 'hono:rateLimitException',
                  error: {
                    message: 'unknownIpAddress',
                    connectionInfo: info,
                    url: c.req.url,
                    httpMethod: c.req.method,
                  },
                })
                .run()
            })
          }

          return ipAddress
        },
      })
    : devMiddleware // Rate limiting in dev just gets in the way.
}
