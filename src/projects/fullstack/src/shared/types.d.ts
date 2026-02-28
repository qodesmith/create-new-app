/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

import type {auth} from '../server/db/auth/auth'
import type * as appSchema from '../server/db/schema/appSchema'
import type * as authSchema from '../server/db/schema/authSchema'

declare global {
  namespace NodeJS {
    // biome-ignore lint/style/useConsistentTypeDefinitions: it's ok
    interface ProcessEnv {
      // biome-ignore-start lint/style/useNamingConvention: env vars are ok
      NODE_ENV: 'development' | 'production' | 'test'
      // biome-ignore-end lint/style/useNamingConvention: env vars are ok
    }
  }
}

export type Prettify<T> = T extends Date
  ? T
  : T extends Record<any, any>
    ? {[K in keyof T]: Prettify<T[K]>} & {}
    : T

/**
 * Maps an `as const` string array into an object where keys equals the values.
 * T must be a readonly string array (i.e. declared with `as const`).
 */
export type MirrorMap<T extends readonly string[]> = {[K in T[number]]: K}

export type DateToString<T> = T extends Date
  ? string
  : T extends Record<any, any>
    ? {[K in keyof T]: DateToString<T[K]>}
    : T

export type {HonoAuthServer} from '../server/hono/authRoutes'
export type {HonoServer} from '../server/hono/honoServer'

export type ServerAuth = typeof auth

/**
 * Errors are errors returned from API endpoints. Failures are errors caught in
 * a catch statement from trying to hit API endpoints.
 */
export type ErrorContext =
  | 'client:topLevel'
  | 'client:missingUser'
  | 'client:signInFailure'
  | 'client:signInError'
  | 'client:signUpFailure'
  | 'client:signUpError'
  | 'client:signOutFailure'
  | 'client:signOutError'
  | 'client:resetPasswordFailure'
  | 'client:resetPasswordError'
  | 'client:requestPasswordResetFailure'
  | 'client:requestPasswordResetError'
  | 'client:changeEmailFailure'
  | 'client:changeEmailError'
  | 'client:changePasswordFailure'
  | 'client:changePasswordError'
  | 'client:avatarUploadFailure'
  | 'client:avatarUploadError'
  | 'client:avatarDeleteError'
  | 'rateLimitMiddleware'
  | 'hono:topLevel'
  | 'hono:betterAuth'
  | 'resend:sendSignUpVerificationEmailFailure'
  | 'resend:sendSignUpVerificationEmailError'
  | 'resend:sendResetPasswordEmailFailure'
  | 'resend:sendResetPasswordEmailError'
  | 'resend:sendChangePasswordEmailFailure'
  | 'resend:sendChangePasswordEmailError'

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
