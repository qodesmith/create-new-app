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
 * 1. Client API calls get a rejection/exception pair:
 *    `client:<operation>:rejection` - API responded (2xx) but returned an error
 *    `client:<operation>:exception` - error caught in the catch clause
 *
 * 2. Server-side async calls to external services also get a pair:
 *    `<service>:<operation>:rejection` - service responded but indicated failure
 *    `<service>:<operation>:exception` - error caught in the catch clause
 *
 * 3. Standalone error scenarios (less common) only get exception:
 *    `<area>:<name>:exception` - catch-all or one-off error handler
 */
export type ErrorContext =
  // Server
  | 'hono:topLevel:exception'
  | 'betterAuth:topLevel:exception'
  | 'resend:sendSignUpVerificationEmail:rejection'
  | 'resend:sendSignUpVerificationEmail:exception'
  | 'resend:sendResetPasswordEmail:rejection'
  | 'resend:sendResetPasswordEmail:exception'
  | 'resend:sendChangeEmail:rejection'
  | 'resend:sendChangeEmail:exception'
  | 'resend:sendDeleteAccountVerificationEmail:rejection'
  | 'resend:sendDeleteAccountVerificationEmail:exception'
  | 'dbCleanup:purgeStaleRecords:exception'

  // Client
  | 'client:topLevel:exception'
  | 'client:signIn:rejection'
  | 'client:signIn:exception'
  | 'client:signUp:rejection'
  | 'client:signUp:exception'
  | 'client:signOut:rejection'
  | 'client:signOut:exception'
  | 'client:resetPassword:rejection'
  | 'client:resetPassword:exception'
  | 'client:requestPasswordReset:rejection'
  | 'client:requestPasswordReset:exception'
  | 'client:changeEmail:rejection'
  | 'client:changeEmail:exception'
  | 'client:changePassword:rejection'
  | 'client:changePassword:exception'
  | 'client:avatarUpload:rejection'
  | 'client:avatarUpload:exception'
  | 'client:avatarDelete:rejection'
  | 'client:avatarDelete:exception'
  | 'client:passkeyAdd:rejection'
  | 'client:passkeyAdd:exception'
  | 'client:passkeyDelete:rejection'
  | 'client:passkeyDelete:exception'
  | 'client:deleteAccount:rejection'
  | 'client:deleteAccount:exception'
  | 'client:passkeyList:rejection'
  | 'client:passkeyList:exception'
  | 'client:passkeySignIn:rejection'
  | 'client:passkeySignIn:exception'
