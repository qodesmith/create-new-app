import type {SessionData} from '@/server/db/auth/auth'

import {authMiddleware} from '@/server/middleware/authMiddleware'

import {Hono} from 'hono'

export type HonoAuthServer = typeof authRoutes

// biome-ignore lint/style/useNamingConvention: Hono expects `Variables` as a type argument
export const authRoutes = new Hono<{Variables: SessionData}>()
  .use(authMiddleware)
  .get('/test', c => {
    return c.json({auth: true, date: new Date().toISOString()})
  })
