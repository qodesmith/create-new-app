/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

import type {FileRouteTypes} from '../client/routeTree.gen'
import type {auth} from '../server/db/auth/auth'

export type * from '../server/types.d'

export type ClientRoute = FileRouteTypes['to']

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
 * - `<service>:<operation>:rejection` - service responded but indicated failure
 * - `<service>:<operation>:exception` - error caught in a catch clause
 *
 * Rejections are only listed here when they represent a real bug signal
 * (server-side state inconsistency, infra failure, etc.). Expected user-error
 * rejections like wrong passwords, expired reset tokens, or oversized uploads
 * are surfaced via the UI without being logged anywhere.
 */
export type ErrorContext =
  // Server
  | 'hono:topLevel:exception'
  | 'betterAuth:topLevel:exception'
  | 'betterAuth:signOut:rejection'
  | 'betterAuth:passkeyDelete:rejection'
  | 'betterAuth:passkeyList:rejection'
  | 'resend:sendSignUpVerificationEmail:rejection'
  | 'resend:sendSignUpVerificationEmail:exception'
  | 'resend:sendResetPasswordEmail:rejection'
  | 'resend:sendResetPasswordEmail:exception'
  | 'resend:sendChangeEmailConfirmation:rejection'
  | 'resend:sendChangeEmailConfirmation:exception'
  | 'resend:sendChangeEmailVerification:rejection'
  | 'resend:sendChangeEmailVerification:exception'
  | 'resend:sendDeleteAccountVerificationEmail:rejection'
  | 'resend:sendDeleteAccountVerificationEmail:exception'
  | 'dbCleanup:purgeStaleRecords:exception'

  // Client
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
