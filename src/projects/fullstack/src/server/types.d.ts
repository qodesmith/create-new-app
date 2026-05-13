import type {Input, MiddlewareHandler} from 'hono'
import type {HandlerResponse} from 'hono/types'
import type {Prettify} from '@/shared/types'
import type {auth} from './db/auth/auth'
import type * as appSchema from './db/schema/appSchema'
import type * as authSchema from './db/schema/authSchema'

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

export type SharedAuditLogsMetadata =
  | {
      action: 'purge-stale-users'
      deletedCount: number
    }
  | {
      action: 'purge-expired-verifications'
      deletedCount: number
    }
  | {
      action: 'purge-stale-ratelimits'
      deletedCount: number
    }
  | {
      action: 'purge-stale-errors'
      deletedCount: number
    }

export type AdminAuditLogsMetadata =
  | SharedAuditLogsMetadata
  | {action: 'download-database'}

export type SystemAuditLogsMetadata = SharedAuditLogsMetadata

/**
 * Extracts the environment type from a Hono middleware handler.
 */
export type MiddlewareEnv<Handler> = Prettify<
  Handler extends MiddlewareHandler<
    infer E,
    string,
    Input,
    HandlerResponse<unknown>
  >
    ? E
    : never
>

export type BetterAuthEndpoint = {
  [K in keyof typeof auth.api]: (typeof auth.api)[K] extends {path: infer P}
    ? string extends P
      ? never
      : P
    : never
}[keyof typeof auth.api]
