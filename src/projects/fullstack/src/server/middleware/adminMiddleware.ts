import type {MiddlewareEnv} from '@/server/types'

import {authMiddleware} from '@/server/middleware/authMiddleware'
import {isAdminUser} from '@/server/utils/validateUserRole'

import {every} from 'hono/combine'
import {createMiddleware} from 'hono/factory'

type AuthMiddlewareEnv = MiddlewareEnv<typeof authMiddleware>

export const adminMiddleware = createMiddleware<AuthMiddlewareEnv>(
  async (c, next) => {
    const handler = every(
      authMiddleware, // Sets `user` on the context object.

      createMiddleware<AuthMiddlewareEnv>(async (innerContext, innerNext) => {
        const user = innerContext.get('user')

        if (!isAdminUser(user)) {
          return innerContext.json({error: 'Forbidden'}, 403)
        }

        await innerNext()
      })
    )

    return handler(c, next)
  }
)
