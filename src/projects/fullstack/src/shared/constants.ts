import type {ClientRoute} from '@/shared/types'

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

// Add new user roles by adding matching key/value pairs.
export const userRoles = Object.freeze({
  admin: 'admin',
  user: 'user',
})
