import type * as appSchema from './db/schema/appSchema'
import type * as authSchema from './db/schema/authSchema'

export type {auth} from './db/auth/auth'
export type {HonoAuthServer} from './hono/authRoutes'
export type {HonoServer} from './hono/honoServer'

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
