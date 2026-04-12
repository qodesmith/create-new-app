import type * as appSchema from '@/server/db/schema/appSchema'
import type * as authSchema from '@/server/db/schema/authSchema'

export type {auth} from '@/server/db/auth/auth'
export type {HonoAuthServer} from '@/server/hono/authRoutes'
export type {HonoServer} from '@/server/hono/honoServer'

export type AppSchemaInsert = {
  [K in keyof typeof appSchema as '$inferInsert' extends keyof (typeof appSchema)[K]
    ? K
    : never]: (typeof appSchema)[K]['$inferInsert']
}

export type AppSchemaSelect = {
  [K in keyof typeof appSchema as '$inferSelect' extends keyof (typeof appSchema)[K]
    ? K
    : never]: (typeof appSchema)[K]['$inferSelect']
}

export type AuthSchemaInsert = {
  [K in keyof typeof authSchema as '$inferInsert' extends keyof (typeof authSchema)[K]
    ? K
    : never]: (typeof authSchema)[K]['$inferInsert']
}

export type AuthSchemaSelect = {
  [K in keyof typeof authSchema as '$inferSelect' extends keyof (typeof authSchema)[K]
    ? K
    : never]: (typeof authSchema)[K]['$inferSelect']
}
