import type {MiddlewareHandler} from 'hono'

import process from 'node:process'

import {isProd} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'

import {bestEffort, getUnitInMs} from '@qodestack/utils'
import {getConnInfo} from 'hono/bun'
import {HTTPException} from 'hono/http-exception'
import {rateLimiter} from 'hono-rate-limiter'

export function getRateLimitMiddleware({
  windowMs = getUnitInMs(1, 'h'), // 1 hour
  limit = 10, // 10 requests per hour per IP
} = {}): MiddlewareHandler {
  const devMiddleware: MiddlewareHandler = (_c, next) => next()

  return isProd
    ? rateLimiter({
        windowMs,
        limit,
        standardHeaders: 'draft-6',
        keyGenerator: c => {
          const info = getConnInfo(c)
          const behindFly = !!process.env.FLY_APP_NAME

          /**
           * Proxy-set headers are checked first because in production
           * `remote.address` is typically the proxy's IP, not the client's.
           */
          const ipAddress =
            (behindFly && c.req.header('fly-client-ip')) ||
            c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
            c.req.header('x-real-ip') ||
            info.remote.address

          if (!ipAddress) {
            const db = getDatabase()

            bestEffort(() => {
              db.insert(errorsTable)
                .values({
                  context: 'hono:rateLimit:exception',
                  error: {
                    message: 'unknownIpAddress',
                    connectionInfo: info,
                    url: c.req.url,
                    httpMethod: c.req.method,
                  },
                })
                .run()
            })

            throw new HTTPException(403, {message: 'Forbidden'})
          }

          return ipAddress
        },
      })
    : devMiddleware // Rate limiting in dev just gets in the way.
}
