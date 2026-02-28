import {auth} from '@/server/db/auth/auth'

import {createMiddleware} from 'hono/factory'

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({headers: c.req.raw.headers})

  if (!session) {
    return c.json('Unauthorized', 401)
  }

  c.set('session', session.session)
  /**
   * https://github.com/better-auth/better-auth/issues/2349#issuecomment-2817112648
   *
   * Better Auth hardcodes user.id as string in its internal Zod schema,
   * regardless of `useNumberId: true` in `authOptions.advanced.database`.
   * They have no plans to change this, so we manually coerce to a number.
   */
  c.set('user', {...session.user, id: Number(session.user.id)})

  await next()
})
