import type {AuthedSessionData} from '@/server/db/auth/auth'

import {auth} from '@/server/db/auth/auth'

import {createMiddleware} from 'hono/factory'

// biome-ignore lint/style/useNamingConvention: Hono api
export const authMiddleware = createMiddleware<{Variables: AuthedSessionData}>(
  async (c, next) => {
    const session = await auth.api.getSession({headers: c.req.raw.headers})

    if (!session) {
      return c.json({error: 'Unauthorized'}, 401)
    }

    c.set('session', session.session)
    c.set('user', session.user)

    await next()
  }
)
