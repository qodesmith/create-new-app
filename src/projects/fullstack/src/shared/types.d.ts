/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

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

type BuiltIn =
  | Date
  | RegExp
  | Error
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | Promise<any>
  | ArrayBuffer
  | ((...args: any[]) => any)

export type Prettify<T> = T extends BuiltIn
  ? T
  : T extends Array<infer U>
    ? Prettify<U>[]
    : T extends object
      ? {[K in keyof T]: Prettify<T[K]>} & {}
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
  | 'resend:sendChangeEmailRejection'
  | 'resend:sendChangeEmailException'
  | 'resend:sendDeleteAccountVerificationEmailRejection'
  | 'resend:sendDeleteAccountVerificationEmailException'

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
  | 'client:deleteAccountRejection'
  | 'client:deleteAccountException'
  | 'client:passkeyListRejection'
  | 'client:passkeyListException'
  | 'client:passkeySignInRejection'
  | 'client:passkeySignInException'
