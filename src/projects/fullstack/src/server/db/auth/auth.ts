import type {DrizzleAdapterConfig} from '@better-auth/drizzle-adapter'
import type {BetterAuthOptions} from 'better-auth'
import type {Password} from 'bun'
import type {BetterAuthEndpoint, Prettify} from '@/shared/types'

import {randomBytes} from 'node:crypto'

import {
  domain,
  isProd,
  localhost,
  localOriginList,
  origin,
  prodOriginList,
  userRoles,
} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import ChangeEmailConfirmationEmail from '@/server/email/ChangeEmailConfirmationEmail'
import ChangeEmailVerificationEmail from '@/server/email/ChangeEmailVerificationEmail'
import DeleteAccountVerificationEmail from '@/server/email/DeleteAccountVerificationEmail'
import ResetPasswordEmail from '@/server/email/ResetPasswordEmail'
import SignUpVerificationEmail from '@/server/email/SignUpVerificationEmail'
import {sendEmail} from '@/server/email/sendEmail'
import {log} from '@/server/utils/logger'
import {
  betterAuthBasePath,
  callbackURLSuccessParam,
  changeEmailCallbackRoutes,
  emailVerificationExpiryInSeconds,
  minPasswordLength,
  nameValidationMessage,
} from '@/shared/constants'
import {
  emailValidator,
  nameValidator,
  passwordValidator,
} from '@/shared/validators'

import {drizzleAdapter} from '@better-auth/drizzle-adapter'
import {passkey} from '@better-auth/passkey'
import {getUnitInSeconds} from '@qodestack/utils'
import {type} from 'arktype'
import {betterAuth} from 'better-auth'
import {APIError, createAuthMiddleware} from 'better-auth/api'
import {admin} from 'better-auth/plugins'

const passwordAlgorithm: Password.Argon2Algorithm['algorithm'] = 'argon2id'

export type AuthedSessionData = Prettify<{
  user: typeof auth.$Infer.Session.user
  session: typeof auth.$Infer.Session.session
}>

export const authOptions = {
  appName: '{{PROJECT_NAME}}',
  baseURL: isProd ? origin : localhost,

  // There is a matching Hono endpoint for this.
  basePath: betterAuthBasePath,

  hooks: {
    before: createAuthMiddleware(async ctx => {
      const body = ctx.body as Record<string, string | undefined>
      const ctxPath = ctx.path as BetterAuthEndpoint
      const passwordError = new APIError('BAD_REQUEST', {
        message: `Invalid password: must be at least ${minPasswordLength} characters long`,
      })
      const emailError = new APIError('BAD_REQUEST', {message: 'Invalid email'})

      // Server-side form validation when signing up.
      if (ctxPath === '/sign-up/email') {
        const {email, name, lastName, password} = body
        // ---

        const emailResult = emailValidator(email)
        if (emailResult instanceof type.errors) {
          throw emailError
        }

        const nameResult = nameValidator(name)
        if (nameResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message: `Invalid name: ${nameValidationMessage}`,
          })
        }

        const lastNameResult = nameValidator(lastName)
        if (lastNameResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message: `Invalid last name: ${nameValidationMessage}`,
          })
        }

        const passwordResult = passwordValidator(password)
        if (passwordResult instanceof type.errors) {
          throw passwordError
        }
      }

      // Server-side form validation when changing email.
      if (ctxPath === '/change-email') {
        const {newEmail} = body
        const emailResult = emailValidator(newEmail)

        if (emailResult instanceof type.errors) {
          throw emailError
        }
      }

      if (ctxPath === '/change-password' || ctxPath === '/reset-password') {
        const {password} = body
        const passwordResult = passwordValidator(password)

        if (passwordResult instanceof type.errors) {
          throw passwordError
        }
      }

      // Server-side form validation when updating user name/lastName.
      if (ctxPath === '/update-user') {
        const {name, lastName} = body

        const nameResult = nameValidator(name)
        if (nameResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message: `Invalid name: ${nameValidationMessage}`,
          })
        }

        const lastNameResult = nameValidator(lastName)
        if (lastNameResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message: `Invalid last name: ${nameValidationMessage}`,
          })
        }
      }
    }),
  },

  emailVerification: {
    sendOnSignUp: true,
    expiresIn: emailVerificationExpiryInSeconds,
    autoSignInAfterVerification: true,

    /**
     * This function is called by multiple endpoints that trigger any sort of
     * verification process. We trigger different logic by distinguishing the
     * endpoint by the url pathname.
     */
    sendVerificationEmail: async ({user, url, token: _token}, request) => {
      if (!request) {
        throw new Error('No request found for sendVerificationEmail')
      }

      const {pathname} = new URL(request.url)
      const endpoint = pathname.slice(
        betterAuthBasePath.length
      ) as BetterAuthEndpoint

      /**
       * Using `void` (fire-and-forget) to prevent timing attacks. Without it,
       * response time varies based on whether an email is sent, letting
       * attackers discover valid accounts by measuring response latency.
       */

      if (endpoint === '/sign-up/email') {
        return void sendEmail({
          user,
          subject: 'Verify your email address',
          react: SignUpVerificationEmail({verificationUrl: url}),
          rejectionContext: 'resend:sendSignUpVerificationEmail:rejection',
          exceptionContext: 'resend:sendSignUpVerificationEmail:exception',
        })
      }

      /**
       * This is STEP 2 of a two-step process to change a user's email:
       *
       * - STEP 1 (sendChangeEmailConfirmation) - confirm the INTENT to change email
       * - STEP 2 (this function) - verify the ACTION to change email
       */
      if (endpoint === '/verify-email') {
        const verificationUrl = new URL(url)
        verificationUrl.searchParams.set(
          'callbackURL',
          changeEmailCallbackRoutes.step2
        )

        return void sendEmail({
          user,
          subject: 'Verify your updated email',
          react: ChangeEmailVerificationEmail({
            verificationUrl: verificationUrl.href,
            newEmail: user.email,
          }),
          rejectionContext: 'resend:sendChangeEmailVerification:rejection',
          exceptionContext: 'resend:sendChangeEmailVerification:exception',
        })
      }
    },
  },

  // https://www.better-auth.com/docs/authentication/email-password
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: getUnitInSeconds(15, 'm'),
    minPasswordLength,

    /**
     * The callback URL the user returns to is defined in client code:
     * `authClient.requestPasswordReset` => `redirectTo`.
     */
    sendResetPassword: async ({user, url, token: _token}, _request) => {
      /**
       * Better Auth verifies that the user actually exists before calling
       * sendResetPassword. No need to manually check first.
       */
      void sendEmail({
        user,
        subject: 'Reset your password',
        react: ResetPasswordEmail({resetUrl: url}),
        rejectionContext: 'resend:sendResetPasswordEmail:rejection',
        exceptionContext: 'resend:sendResetPasswordEmail:exception',
      })
    },

    /**
     * https://bun.com/docs/runtime/hashing
     *
     * Using Bun to hash and verify passwords so we can manually do things
     * predictably if we need to. For example, generating a new password hash
     * and updating the database manually if need be.
     */
    password: {
      hash: async password => {
        return Bun.password.hash(password, passwordAlgorithm)
      },
      verify: async ({password, hash}) => {
        return Bun.password.verify(password, hash, passwordAlgorithm)
      },
    },
  },

  // https://www.better-auth.com/docs/concepts/session-management
  session: {
    /**
     * Prevent GET /get-session from performing database writes and instead
     * force the client to make an additional POST request to refresh a session.
     */
    deferSessionRefresh: true,

    /**
     * Cookie cache is disabled by default but it's worth doing it explicitly
     * here so it's not opaque. This will force the client to fetch fresh
     * sessions anywhere `authClient.getSession()` is called - in particular,
     * authenticated routes.
     */
    cookieCache: {
      enabled: false,
    },
  },

  user: {
    additionalFields: {
      lastName: {
        type: 'string',
        required: true,
        sortable: true,
      },
    },
    changeEmail: {
      enabled: true,

      /**
       * This is STEP 1 of a two-step process to change a user's email:
       *
       * - STEP 1 (this function) - confirm the INTENT to change email
       * - STEP 2 (sendVerificationEmail) - verify the ACTION to change email
       */
      sendChangeEmailConfirmation: async (
        {user, newEmail, url, token: _token},
        _request
      ) => {
        const confirmationUrl = new URL(url)
        const callbackURL = confirmationUrl.searchParams.get('callbackURL')
        const [callbackURLPath, callbackURLSearchStr] =
          callbackURL?.split('?') ?? []

        // This should NEVER be false.
        if (!(callbackURL && callbackURLPath)) {
          throw new Error('No callbackURL found in sendChangeEmailConfirmation')
        }

        /**
         * The callbackURL is itself a query param on the `url` we get from
         * Better Auth. It is where the user is redirected to. The callbackURL
         * itself may contain query params that need to be maintained. This
         * shouldn't be the case, but we play it safe regardless.
         */
        const callbackURLQueryParams = new URLSearchParams(callbackURLSearchStr)

        /**
         * Better Auth will append and `error` query param to the callbackURL
         * when the token is expired. Unfortunately, no query params are
         * appended when the token is still valid, making it impossible to
         * distinguish between a valid state or someone simply visiting the
         * callbackURL directly.
         *
         * Therefore, we manually append a custom query param as a convention to
         * distinguish successful redirects from direct callbackURL visits
         * inside the confirmation route's `beforeLoad`.
         */
        callbackURLQueryParams.set(
          callbackURLSuccessParam,
          randomBytes(2).toString('hex')
        )
        const newCallbackURL = `${callbackURLPath}?${callbackURLQueryParams}`
        confirmationUrl.searchParams.set('callbackURL', newCallbackURL)

        void sendEmail({
          user,
          subject: 'Confirm your email change request',
          react: ChangeEmailConfirmationEmail({
            confirmationUrl: confirmationUrl.href,
            newEmail,
          }),
          rejectionContext: 'resend:sendChangeEmailConfirmation:rejection',
          exceptionContext: 'resend:sendChangeEmailConfirmation:exception',
        })
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async (
        {user, url, token: _token},
        _request
      ) => {
        void sendEmail({
          user,
          subject: 'Confirm account deletion',
          react: DeleteAccountVerificationEmail({verificationUrl: url}),
          rejectionContext:
            'resend:sendDeleteAccountVerificationEmail:rejection',
          exceptionContext:
            'resend:sendDeleteAccountVerificationEmail:exception',
        })
      },
    },
  },

  // By default this is enabled in production and disabled in development.
  rateLimit: {
    storage: 'database',
    modelName: 'ratelimit',
  },

  logger: {
    disabled: true, // Enable this for server-side logging to the console.
    level: 'info',
    log: (level, message, ...args) => {
      const logLevel: keyof typeof log = (() => {
        switch (level) {
          case 'debug':
          case 'warn':
            return 'warning'
          case 'error':
            return 'error'
          default:
            return 'text'
        }
      })()

      log[logLevel]('[Better Auth]', message, ...args)
    },
  },

  advanced: {
    /**
     * Secure cookies only get sent over https. Generally speaking, this
     * excludes http://localhost. However, some modern browsers treat localhost
     * as a secure origin even when access via `http://`. To keep consistency
     * and avoid confusion, secure cookies are only enabled in production.
     */
    useSecureCookies: isProd,
  },

  onAPIError: {
    throw: true,
  },

  telemetry: {
    enabled: false,
  },

  plugins: [
    /**
     * https://www.better-auth.com/docs/plugins/admin
     * Adds user roles and various user management capabilities.
     */
    admin({
      defaultRole: userRoles.user,
      adminRoles: [userRoles.admin],
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultBanReason: 'Account suspended',
      bannedUserMessage:
        'This account has been suspended. Contact support if you believe this is an error.',
    }),

    /**
     * https://www.better-auth.com/docs/plugins/passkey
     * Passkeys replace passwords with unique key pairs: a private key stored on
     * the user's device and a public key shared with the website.
     */
    passkey({
      // The relying party ID, typically your domain.
      rpID: isProd ? domain : 'localhost',

      // TODO - update rpName to a semantic name for your app.
      // Human-readable name shown in browser prompts.
      rpName: '{{PROJECT_NAME}}',

      // Fully qualified URL where passkey actions happen.
      origin: isProd ? prodOriginList : localOriginList,
    }),
  ],
  trustedOrigins: isProd ? prodOriginList : localOriginList,
} as const satisfies BetterAuthOptions

export const drizzleAdapterOptions = {
  provider: 'sqlite',
  usePlural: true,
  camelCase: true,
} satisfies DrizzleAdapterConfig

export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(getDatabase(), drizzleAdapterOptions),
})
