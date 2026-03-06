/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

//////////////////////////////////////////////////////////////
// DO NOT use alias imports (i.e. @/server) in this file!!! //
// It will break TypeScript and type everything as `any`.   //
//////////////////////////////////////////////////////////////

import type {auth} from '../server/db/auth/auth'

export type * from '../server/types.d'

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

export type ServerAuth = typeof auth

/**
 * Naming convention: `<service>:<operation><Suffix>`
 *
 * 1. Client API calls get a Rejection/Exception pair:
 *    `client:<operation>Rejection` - API responded (2xx) but returned an error
 *    `client:<operation>Exception` - error caught in the catch clause
 *
 * 2. Server-side async calls to external services also get a pair:
 *    `<service>:<operation>Rejection` - service responded but indicated failure
 *    `<service>:<operation>Exception` - error caught in the catch clause
 *
 * 3. Standalone error scenarios (less common) only get Exception:
 *    `<area>:<name>Exception` - catch-all or one-off error handler
 */
export type ErrorContext =
  // Server
  | 'hono:topLevelException'
  | 'hono:rateLimitException'
  | 'betterAuth:topLevelException'
  | 'resend:sendSignUpVerificationEmailRejection'
  | 'resend:sendSignUpVerificationEmailException'
  | 'resend:sendResetPasswordEmailRejection'
  | 'resend:sendResetPasswordEmailException'
  | 'resend:sendChangePasswordEmailRejection'
  | 'resend:sendChangePasswordEmailException'

  // Client
  | 'client:topLevelException'
  | 'client:signInRejection'
  | 'client:signInException'
  | 'client:signUpRejection'
  | 'client:signUpException'
  | 'client:signOutRejection'
  | 'client:signOutException'
  | 'client:resetPasswordRejection'
  | 'client:resetPasswordException'
  | 'client:requestPasswordResetRejection'
  | 'client:requestPasswordResetException'
  | 'client:changeEmailRejection'
  | 'client:changeEmailException'
  | 'client:changePasswordRejection'
  | 'client:changePasswordException'
  | 'client:avatarUploadRejection'
  | 'client:avatarUploadException'
  | 'client:avatarDeleteRejection'
  | 'client:avatarDeleteException'
  | 'client:passkeyAddRejection'
  | 'client:passkeyAddException'
  | 'client:passkeyDeleteRejection'
  | 'client:passkeyDeleteException'
  | 'client:passkeyRenameRejection'
  | 'client:passkeyRenameException'
  | 'client:passkeyListRejection'
  | 'client:passkeyListException'
  | 'client:passkeySignInRejection'
  | 'client:passkeySignInException'
