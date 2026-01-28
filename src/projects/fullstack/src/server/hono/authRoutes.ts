import type {SessionData} from '@/server/db/auth/auth'

import {authMiddleware} from '@/server/middleware/authMiddleware'

import {Hono} from 'hono'

export type HonoAuthServer = typeof authRoutes

// biome-ignore lint/style/useNamingConvention: this is how Hono does it
export const authRoutes = new Hono<{Variables: SessionData}>()
  .use(authMiddleware)
  .get(c => {
    return c.json({auth: true})
  })
