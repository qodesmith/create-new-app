import type {Input, MiddlewareHandler} from 'hono'
import type {HandlerResponse} from 'hono/types'
import type {userRoles} from '@/shared/constants'
import type {Prettify} from '@/shared/types'
import type {auth} from './db/auth/auth'
import type * as appSchema from './db/schema/appSchema'
import type * as authSchema from './db/schema/authSchema'

export type {HonoAdminServer} from './hono/adminRoutes'
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

/** This is the source of truth for the systemAuditLogsTable schema metadata. */
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

export type SystemAuditLogAction = Pick<
  SharedAuditLogsMetadata,
  'action'
>['action']

export type DownloadDatabaseStatus = 'started' | 'complete' | 'fail'

/**
 * One discriminated arm per better-auth admin-plugin mutation we audit. Written
 * from the `after` hook in `db/auth/auth.ts`, one row per successful action. The
 * acting admin is the `userId` FK on the row; everything user-specific to the
 * action lives here in the (FK-free) JSON metadata. `targetUserId` is the user
 * the action was performed ON. Secrets (passwords) are never recorded.
 *
 * Keep in sync with `adminAuditLogActions` in shared/constants.ts and the
 * Details cell in `-adminAuditLogsColumns.tsx`.
 */
export type AdminUserManagementAuditMetadata =
  | {
      action: 'create-user'
      targetUserId: string
      email: string
      role: string | null
    }
  | {
      // Admin-driven edit only (better-auth `/admin/update-user`). The
      // self-service `/update-user` core endpoint is intentionally not audited.
      action: 'update-user'
      targetUserId: string
      updatedFields: string[]
    }
  | {
      action: 'set-user-role'
      targetUserId: string
      role: keyof typeof userRoles
    }
  | {
      action: 'ban-user'
      targetUserId: string
      banReason: string | null
      banExpiresIn: number | null
    }
  | {
      action: 'unban-user'
      targetUserId: string
    }
  | {
      // Only the target is recorded — NEVER the password.
      action: 'set-user-password'
      targetUserId: string
    }
  | {
      action: 'remove-user'
      targetUserId: string
    }
  | {
      /**
       * This endpoint keys off a session token, not a user id. We grab the user
       * id from a db query of the session object in the `before` hook, return
       * it there, so the `after` hook (which uses these types) can log it.
       */
      action: 'revoke-user-session'
      sessionToken: string
      targetUserId: string
    }
  | {
      action: 'revoke-user-sessions'
      targetUserId: string
    }
  | {
      action: 'impersonate-user'
      targetUserId: string
    }
  | {
      // `targetUserId` is the user who was being impersonated.
      action: 'stop-impersonating'
      targetUserId: string
    }

export type AdminAuditLogsMetadata =
  | SharedAuditLogsMetadata
  | AdminUserManagementAuditMetadata
  | {
      action: 'download-database'
      /**
       * `started` — row was inserted at request start, stream not yet finalized.
       * `complete` — stream piped to the client successfully (`updatedAt` is the
       * completion time).
       * `fail` — stream errored, was cancelled, or the row was reaped at boot
       * as an orphan from a previous process.
       */
      status: DownloadDatabaseStatus
    }

export type AdminAuditLogAction = Pick<
  AdminAuditLogsMetadata,
  'action'
>['action']

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
