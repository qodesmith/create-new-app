/**
 * Persisted application error contexts use three explicit parts:
 * `<service>:<operation>:<outcome>`.
 *
 * Use `exception` for thrown failures and client-side request failures. Use
 * `rejection` only when an external service reports an operational failure that
 * should be captured. Expected product or validation outcomes should not be
 * captured just because the UI displays an error message.
 */
export type ErrorContext =
  // Server
  | 'bun:topLevel:exception'
  | 'hono:topLevel:exception'
  | 'hono:rateLimit:exception'
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
  | 'client:signIn:exception'
  | 'client:signUp:exception'
  | 'client:signOut:exception'
  | 'client:resetPassword:exception'
  | 'client:requestPasswordReset:exception'
  | 'client:changeEmail:exception'
  | 'client:changePassword:exception'
  | 'client:deleteAccount:exception'
  | 'client:avatarUpload:exception'
  | 'client:avatarDelete:exception'
  | 'client:passkeyAdd:exception'
  | 'client:passkeyDelete:exception'
  | 'client:passkeyList:exception'
  | 'client:passkeySignIn:exception'
