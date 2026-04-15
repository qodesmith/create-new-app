import type {SessionData} from '@/server/db/auth/auth'

import {authMiddleware} from '@/server/middleware/authMiddleware'
import {isAdminUser} from '@/server/utils/validateUserRole'

import {every} from 'hono/combine'
import {createMiddleware} from 'hono/factory'

export const adminMiddleware = every(
  authMiddleware, // Sets `user` on the context object.
  createMiddleware(async (c, next) => {
    // Type casting here because types don't fall through from authMiddleware.
    const user = c.get('user') as SessionData['user'] | undefined

    if (!user) {
      // Auth middleware was not run or the user is not authenticated.
      return c.json({error: 'Unauthorized'}, 401)
    }

    if (!isAdminUser(user)) {
      return c.json({error: 'Forbidden'}, 403)
    }

    await next()
  })
)
