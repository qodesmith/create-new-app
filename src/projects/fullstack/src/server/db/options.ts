import type {BetterAuthOptions} from 'better-auth'
import type {DrizzleAdapterConfig} from 'better-auth/adapters/drizzle'
import type {Password} from 'bun'

import {
  domain,
  isProd,
  localhost,
  localhost0,
  origin,
  originWww,
  userRoles,
} from '@/server/constants'
import ResetPasswordEmail from '@/server/email/ResetPasswordEmail'
import {sendChangeEmailVerificationEmail} from '@/server/email/sendChangeEmailVerificationEmail'
import {sendEmail} from '@/server/email/sendEmail'
import {log} from '@/server/utils/logger'
import {betterAuthBasePath, minPasswordLength} from '@/shared/constants'

import {passkey} from '@better-auth/passkey'
import {getUnitInSeconds} from '@qodestack/utils'
import {type} from 'arktype'
import {APIError} from 'better-auth/api'
import {admin, createAuthMiddleware} from 'better-auth/plugins'

const passwordAlgorithm: Password.Argon2Algorithm['algorithm'] = 'argon2id'

export const drizzleAdapterOptions = {
  provider: 'sqlite',
  usePlural: true,
  camelCase: true,
} satisfies DrizzleAdapterConfig

export const authOptions = {
  appName: '{{PROJECT_NAME}}',
  baseURL: isProd ? origin : localhost,

  // There is a matching Hono endpoint for this.
  basePath: betterAuthBasePath,

  hooks: {
    before: createAuthMiddleware(async ctx => {
      if (ctx.path === '/sign-up/email') {
        const email = ctx.body.email as string | undefined
        const name = ctx.body.name as string | undefined
        const lastName = ctx.body.lastName as string | undefined
        const password = ctx.body.password as string | undefined

        // Validate with arktype
        const emailValidator = type('string.email')
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
    }),
  },

  emailVerification: {
    sendOnSignUp: false,
    expiresIn: getUnitInSeconds(1, 'h'),
    autoSignInAfterVerification: true,
    sendVerificationEmail: async (_data, _request) => {
      // TODO - Send an email verification
    },
  },

  // TODO - enable email verification and disabled autoSignIn once email is wired up
  // https://www.better-auth.com/docs/authentication/email-password
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: getUnitInSeconds(5, 'm'),
    minPasswordLength,
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
      lastName: {
        type: 'string',
        required: true,
        sortable: true,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async (data, _request) => {
        try {
          await sendChangeEmailVerificationEmail({
            user: data.user,
            newEmail: data.newEmail,
            url: data.url,
          })
        } catch (error) {
          log.error('Failed to send change-email verification email', error)
          throw new APIError('INTERNAL_SERVER_ERROR', {
            message:
              'Unable to send verification email. Please try again later.',
          })
        }
      },
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
    disabled: false,
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

      if (args.length) {
        log[logLevel]('[Better Auth]', message, ...args)
      } else {
        log[logLevel]('[Better Auth]', message)
      }
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
      // The relying party ID, typically your domain
      rpID: domain,

      // TODO - update rpName to semantic name for your app.
      // Human-readable name shown in browser prompts
      rpName: '{{PROJECT_NAME}}',

      // Fully qualified URL where passkey actions happen
      origin: [origin, originWww],
    }),
  ],
  trustedOrigins: isProd ? [origin, originWww] : [localhost, localhost0],
} as const satisfies BetterAuthOptions
