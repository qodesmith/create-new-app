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
 * Errors are errors returned from API endpoints. Failures are errors caught in
 * a catch statement from trying to hit API endpoints.
 */
export type ErrorContext =
  // Server
  | 'topLevel:hono'
  | 'topLevel:betterAuth'
  | 'rateLimitMiddleware'
  | 'resend:sendSignUpVerificationEmailFailure'
  | 'resend:sendSignUpVerificationEmailError'
  | 'resend:sendResetPasswordEmailFailure'
  | 'resend:sendResetPasswordEmailError'
  | 'resend:sendChangePasswordEmailFailure'
  | 'resend:sendChangePasswordEmailError'

  // Client
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
  | 'client:passkeyAddFailure'
  | 'client:passkeyAddError'
  | 'client:passkeyDeleteFailure'
  | 'client:passkeyDeleteError'
  | 'client:passkeyRenameFailure'
  | 'client:passkeyRenameError'
  | 'client:passkeyListError'
  | 'client:passkeySignInFailure'
  | 'client:passkeySignInError'
