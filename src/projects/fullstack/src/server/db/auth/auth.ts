import type {BetterAuthOptions} from 'better-auth'
import type {DrizzleAdapterConfig} from 'better-auth/adapters/drizzle'
import type {Password} from 'bun'
import type {AuthSchemaSelect, Prettify} from '@/shared/types'

import {
  domain,
  isProd,
  localhost,
  localhost0,
  origin,
  originWww,
  userRoles,
} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {users} from '@/server/db/schema/authSchema'
import ChangeEmailVerificationEmail from '@/server/email/ChangeEmailVerificationEmail'
import ResetPasswordEmail from '@/server/email/ResetPasswordEmail'
import SignUpVerificationEmail from '@/server/email/SignUpVerificationEmail'
import {sendEmail} from '@/server/email/sendEmail'
import {log} from '@/server/utils/logger'
import {
  betterAuthBasePath,
  emailVerificationExpiryInSeconds,
  minPasswordLength,
} from '@/shared/constants'

import {passkey} from '@better-auth/passkey'
import {getUnitInSeconds} from '@qodestack/utils'
import {type} from 'arktype'
import {APIError, betterAuth} from 'better-auth'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {admin, createAuthMiddleware} from 'better-auth/plugins'
import {eq} from 'drizzle-orm'

const passwordAlgorithm: Password.Argon2Algorithm['algorithm'] = 'argon2id'

export type SessionData = Prettify<typeof auth.$Infer.Session>

export const authOptions = {
  appName: 'my-app',
  baseURL: isProd ? origin : localhost,

  // There is a matching Hono endpoint for this.
  basePath: betterAuthBasePath,

  hooks: {
    before: createAuthMiddleware(async ctx => {
      const emailValidator = type('string.email')

      // Server-side form validation when signing up.
      if (ctx.path === '/sign-up/email') {
        const email = ctx.body.email as string | undefined
        const name = ctx.body.name as string | undefined
        // TODO - decide to keep lastName in the user schema or not.
        const lastName = ctx.body.lastName as string | undefined
        const password = ctx.body.password as string | undefined

        // Validate with arktype.
        const nameValidator = type(/^[a-zA-Z ]{2,}$/)
        const passwordValidator = type(`string >= ${minPasswordLength}`)

        const emailResult = emailValidator(email)
        if (emailResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {message: 'Invalid email'})
        }

        const nameResult = nameValidator(name)
        if (nameResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message:
              'Invalid name: must contain only letters and spaces and be at least 2 characters long',
          })
        }

        const lastNameResult = nameValidator(lastName)
        if (lastNameResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message:
              'Invalid last name: must contain only letters and spaces and be at least 2 characters long',
          })
        }

        const passwordResult = passwordValidator(password)
        if (passwordResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {
            message: `Invalid password: must be at least ${minPasswordLength} characters long`,
          })
        }
      }

      // Server-side form validation when changing email.
      if (ctx.path === '/change-email') {
        const newEmail = ctx.body.newEmail as string | undefined
        const emailResult = emailValidator(newEmail)

        if (emailResult instanceof type.errors) {
          throw new APIError('BAD_REQUEST', {message: 'Invalid email'})
        }
      }
    }),
  },

  emailVerification: {
    sendOnSignUp: true,
    expiresIn: emailVerificationExpiryInSeconds,
    autoSignInAfterVerification: true,

    /**
     * This single callback handles both sign-up and change-email verification.
     *
     * We intentionally avoid using `user.changeEmail.sendChangeEmailVerification`
     * because Better Auth treats it as a fallback for `sendChangeEmailConfirmation`,
     * triggering a 2-step flow that sends a redundant second email. Instead, we
     * detect the flow via `request.url` and use the appropriate email template.
     *
     * https://github.com/better-auth/better-auth/issues/3742#issuecomment-3970358918
     *
     * The callback URL the user returns to is defined in client code:
     * - POST /sign-up/email => `authClient.signUp.email` => `callbackURL`
     * - POST /change-email => `authClient.changeEmail` => `callbackURL`
     */
    sendVerificationEmail: async ({user, url, token: _token}, request) => {
      if (!request) {
        throw new Error('No request found for sendVerificationEmail')
      }

      const {pathname} = new URL(request.url)

      /**
       * Using `void` (fire-and-forget) to prevent timing attacks. Without it,
       * response time varies based on whether an email is sent, letting
       * attackers discover valid accounts by measuring response latency.
       */

      if (pathname === `${betterAuthBasePath}/sign-up/email`) {
        return void sendEmail({
          user,
          subject: 'Verify your email address',
          react: SignUpVerificationEmail({verificationUrl: url}),
          failureContext: 'resend:sendSignUpVerificationEmailFailure',
          errorContext: 'resend:sendSignUpVerificationEmailError',
        })
      }

      if (pathname === `${betterAuthBasePath}/change-email`) {
        /**
         * https://github.com/better-auth/better-auth/issues/2349#issuecomment-2817112648
         *
         * Better Auth returns user.id as a string despite
         * `useNumberId: true` in `authOptions.advanced.database`, and they
         * have no plans to change this. So we coerce to a number here.
         */
        const userId = +user.id

        if (Number.isNaN(userId)) {
          throw new Error('Invalid user id for changing email')
        }

        const db = getDatabase()
        const userFromDb = db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .get()

        if (!userFromDb) {
          throw new Error('Could not find original user in database')
        }

        void sendEmail({
          user: userFromDb,
          subject: 'Confirm your updated email',
          react: ChangeEmailVerificationEmail({
            verificationUrl: url,
            newEmail: user.email,
          }),
          failureContext: 'resend:sendChangePasswordEmailFailure',
          errorContext: 'resend:sendChangePasswordEmailError',
        })
      }
    },
  },

  // https://www.better-auth.com/docs/authentication/email-password
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: getUnitInSeconds(5, 'm'),
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
        failureContext: 'resend:sendResetPasswordEmailFailure',
        errorContext: 'resend:sendResetPasswordEmailError',
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

  session: {
    // https://www.better-auth.com/docs/concepts/session-management#cookie-cache
    cookieCache: {
      enabled: true,
      maxAge: getUnitInSeconds(1, 'h'),
    },
  },

  user: {
    additionalFields: {
      // TODO - decide to keep lastName in the user schema or not.
      lastName: {
        type: 'string',
        required: true,
        sortable: true,
      },
    },
    changeEmail: {
      enabled: true,
      // sendChangeEmailVerification: async (
      //   {user, newEmail, url, token: _token},
      //   _request
      // ) => {
      //   void sendEmail({
      //     user,
      //     subject: 'Confirm your updated email',
      //     react: ChangeEmailVerificationEmail({verificationUrl: url, newEmail}),
      //     failureContext: 'resend:sendChangePasswordEmailFailure',
      //     errorContext: 'resend:sendChangePasswordEmailError',
      //   })
      // },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async (_data, _request) => {
        // TODO - integrate email client solution
      },
    },
  },

  account: {
    accountLinking: {
      enabled: false, // TODO - decide what to do with this feature.

      // Enabling this increases the risk of account takeover.
      allowDifferentEmails: false,

      /**
       * Avoid automatically linking to these providers if their email has not
       * been confirmed by these providers.
       */
      trustedProviders: undefined,
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
    database: {
      useNumberId: true,
    },
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
    admin({defaultRole: userRoles.user, adminRoles: [userRoles.admin]}),

    /**
     * https://www.better-auth.com/docs/plugins/passkey
     * Passkeys replace passwords with unique key pairs: a private key stored on
     * the user's device and a public key shared with the website.
     */
    passkey({
      // The relying party ID, typically your domain.
      rpID: domain,

      // TODO - update rpName to a semantic name for your app.
      // Human-readable name shown in browser prompts.
      rpName: 'my-app',

      // Fully qualified URL where passkey actions happen.
      origin: [origin, originWww],
    }),
  ],
  trustedOrigins: isProd ? [origin, originWww] : [localhost, localhost0],
} as const satisfies BetterAuthOptions

export const drizzleAdapterOptions = {
  provider: 'sqlite',
  usePlural: true,
  camelCase: true,
} satisfies DrizzleAdapterConfig

const _auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(getDatabase(), drizzleAdapterOptions),
})

type _Session = typeof _auth.$Infer.Session

/**
 * Better-auth hardcodes user.id as string in its core Zod schema, regardless
 * of the actual db column type. Our users table uses an integer id, so we
 * override user.id at the source so everything that infers from `auth` gets
 * the correct type.
 */
export const auth = _auth as unknown as Omit<typeof _auth, '$Infer'> & {
  // biome-ignore-start lint/style/useNamingConvention: names come from Better Auth
  $Infer: Omit<typeof _auth.$Infer, 'Session'> & {
    Session: Omit<_Session, 'user'> & {
      // Ensure the user id is a number, not a string.
      user: Omit<_Session['user'], 'id'> & {id: AuthSchemaSelect['users']['id']}
    }
  }
  // biome-ignore-end lint/style/useNamingConvention: names come from Better Auth
}
