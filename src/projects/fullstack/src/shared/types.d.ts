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
 * Naming convention: `<service>:<operation>:<suffix>`
 *
 * Suffix is one of:
 *   `:exception` — code threw or a third-party call raised
 *   `:rejection` — a third party returned a non-success response we treat as an
 *                  error (e.g. Resend's API, Better Auth's handler returning 5xx)
 *
 * The DB only stores genuine errors. User-input failures (wrong password, bad
 * file, expired token) are handled inline with a toast — they're not captured
 * because the system is functioning correctly. Rejections originating on the
 * server are captured server-side; the client never sends rejection data back.
 * Hence every `client:*` context is `:exception` only.
 */
export type ErrorContext =
  // Server
  | 'hono:topLevel:exception'
  | 'hono:rateLimit:exception'
  | 'betterAuth:topLevel:exception'
  | 'betterAuth:topLevel:rejection'
  | 'resend:sendSignUpVerificationEmail:rejection'
  | 'resend:sendSignUpVerificationEmail:exception'
  | 'resend:sendResetPasswordEmail:rejection'
  | 'resend:sendResetPasswordEmail:exception'
  | 'resend:sendChangeEmail:rejection'
  | 'resend:sendChangeEmail:exception'
  | 'resend:sendDeleteAccountVerificationEmail:rejection'
  | 'resend:sendDeleteAccountVerificationEmail:exception'
  | 'dbCleanup:purgeStaleRecords:exception'

  // Client (exceptions only — see header comment)
  | 'client:topLevel:exception'
  | 'client:signIn:exception'
  | 'client:signUp:exception'
  | 'client:signOut:exception'
  | 'client:resetPassword:exception'
  | 'client:requestPasswordReset:exception'
  | 'client:changeEmail:exception'
  | 'client:changePassword:exception'
  | 'client:avatarUpload:exception'
  | 'client:avatarDelete:exception'
  | 'client:passkeyAdd:exception'
  | 'client:passkeyDelete:exception'
  | 'client:deleteAccount:exception'
  | 'client:passkeyList:exception'
  | 'client:passkeySignIn:exception'
