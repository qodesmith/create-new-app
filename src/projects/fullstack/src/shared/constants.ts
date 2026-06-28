import type {
  AdminAuditLogAction,
  ClientRoute,
  SystemAuditLogAction,
} from '@/shared/types'

import {arrayOfAll} from '@/shared/utils'

import {getUnitInSeconds} from '@qodestack/utils'

export const adminRoutePath = '/api/admin' as const

export const authRoutePath = '/api/authenticated' as const

export const betterAuthBasePath = '/api/app-auth' as const

export const minPasswordLength = 8

/**
 * Marker `code` attached to every `APIError` we throw from the Better Auth
 * `before` hook (see auth.ts). The client uses this to distinguish OUR
 * validation messages (safe to display) from library-generated errors (which
 * may leak implementation details). See `getSafeAuthErrorMessage`.
 */
export const serverValidationErrorCode = 'SERVER_VALIDATION' as const

export const namePattern = '[a-zA-Z ]{2,}' as const

export const nameRegex = new RegExp(`^${namePattern}$`)

export const nameValidationMessage =
  'must contain only letters and spaces and be at least 2 characters long'

/** 5MB */
export const maxAvatarUploadSize = 5_242_880

/** 50KB */
export const maxAvatarFileSize = 51_200

export const maxAvatarDimension = 128

/** 1 hour */
export const emailVerificationExpiryInSeconds = getUnitInSeconds(1, 'h')

/** 1 hour */
export const emailVerificationExpiryInMs =
  emailVerificationExpiryInSeconds * 1000

export const changeEmailCallbackRoutes = {
  step1: '/change-email/confirmation',
  step2: '/change-email/verification',
} satisfies {
  step1: ClientRoute
  step2: ClientRoute
}

export const callbackURLSuccessParam = '__data' as const

/**
 * Single source of truth for the `action` filter values surfaced in the admin
 * audit log UI. Keep in sync with `AdminAuditLogsMetadata` in server/types.d.ts.
 */
export const adminAuditLogActions = arrayOfAll<AdminAuditLogAction>()([
  'purge-stale-users',
  'purge-expired-verifications',
  'purge-stale-ratelimits',
  'purge-stale-errors',
  'download-database',

  /**
   * https://better-auth.com/docs/plugins/admin
   * Admin user-management actions. Audited via the `after` hook in
   * db/auth/auth.ts.
   */
  'create-user',
  'set-user-role',
  'set-user-password',
  'update-user',
  'ban-user',
  'unban-user',
  'revoke-user-session',
  'revoke-user-sessions',
  'impersonate-user',
  'stop-impersonating',
  'remove-user',
])

/**
 * Single source of truth for the `action` filter values surfaced in the system
 * audit log UI. Keep in sync with `SystemAuditLogsMetadata` in server/types.d.ts.
 */
export const systemAuditLogActions = arrayOfAll<SystemAuditLogAction>()([
  'purge-stale-users',
  'purge-expired-verifications',
  'purge-stale-ratelimits',
  'purge-stale-errors',
])

/**
 * Single source of truth for error-tracking contexts. The `ErrorContext` union
 * in shared/types.d.ts is derived from this array via `(typeof
 * errorContexts)[number]`, so adding a value here updates the type everywhere.
 * These are also the exact-`context` filter values surfaced in the Errors admin
 * table (and the server-side enum validation for `GET /errors`).
 *
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
export const errorContexts = [
  // Server
  'hono:topLevel:exception',
  'betterAuth:topLevel:exception',
  'betterAuth:signOut:rejection',
  'betterAuth:passkeyDelete:rejection',
  'betterAuth:passkeyList:rejection',
  'resend:sendSignUpVerificationEmail:rejection',
  'resend:sendSignUpVerificationEmail:exception',
  'resend:sendResetPasswordEmail:rejection',
  'resend:sendResetPasswordEmail:exception',
  'resend:sendChangeEmailConfirmation:rejection',
  'resend:sendChangeEmailConfirmation:exception',
  'resend:sendChangeEmailVerification:rejection',
  'resend:sendChangeEmailVerification:exception',
  'resend:sendDeleteAccountVerificationEmail:rejection',
  'resend:sendDeleteAccountVerificationEmail:exception',
  'dbCleanup:purgeStaleRecords:exception',
  'db:backupSnapshot:exception',
  'db:backupStream:exception',
  'bunImage:avatarUpload:exception',

  // Client
  'client:topLevel:exception',
  'client:signIn:exception',
  'client:signUp:exception',
  'client:signOut:exception',
  'client:resetPassword:exception',
  'client:requestPasswordReset:exception',
  'client:changeEmail:exception',
  'client:changePassword:exception',
  'client:changeName:exception',
  'client:avatarUpload:exception',
  'client:avatarDelete:exception',
  'client:passkeyAdd:exception',
  'client:passkeyDelete:exception',
  'client:deleteAccount:exception',
  'client:passkeyList:exception',
  'client:passkeySignIn:exception',
  'client:adminPurge:exception',
  'client:adminBackup:exception',
  'client:adminUpdateUser:exception',
  'client:adminCreateUser:exception',
  'client:adminRemoveUser:exception',
  'client:adminImpersonateUser:exception',
  'client:adminStopImpersonating:exception',
  'client:adminBanUser:exception',
  'client:adminUnbanUser:exception',
  'client:adminSetRole:exception',
  'client:adminRevokeUserSession:exception',
  'client:adminRevokeUserSessions:exception',
  'client:adminSetUserPassword:exception',
] as const

// Add new user roles by adding matching key/value pairs.
export const userRoles = Object.freeze({
  admin: 'admin',
  user: 'user',
})
