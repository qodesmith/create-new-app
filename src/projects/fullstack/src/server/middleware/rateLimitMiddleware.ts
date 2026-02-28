import type {MiddlewareHandler} from 'hono'

import {isProd} from '@/server/constants'
import {bestEffort} from '@/server/utils/bestEffort'

import {getUnitInMs} from '@qodestack/utils'
import {getConnInfo} from 'hono/bun'
import {rateLimiter} from 'hono-rate-limiter'

import {getDatabase} from '../db/getDatabase'
import {errorsTable} from '../db/schema/appSchema'

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
          const ipAddress =
            info.remote.address ||
            c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            c.req.header('cf-connecting-ip') || // Cloudflare
            'unknown'

          if (ipAddress === 'unknown' && logUnknownError) {
            const db = getDatabase()

            bestEffort(() => {
              db.insert(errorsTable)
                .values({
                  context: 'rateLimitMiddleware',
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
    : devMiddleware
}
