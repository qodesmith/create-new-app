import {getUnitInSeconds} from '@qodestack/utils'

export const authRoutePath = '/api/authenticated' as const

export const betterAuthBasePath = '/api/app-auth' as const

export const minPasswordLength = 8

export const namePattern = '[a-zA-Z ]{2,}' as const

export const nameRegex = new RegExp(`^${namePattern}$`)

export const nameValidationMessage =
  'must contain only letters and spaces and be at least 2 characters long'

export const maxAvatarUploadSize = 5_242_880 // 5MB

export const maxAvatarFileSize = 51_200 // 50KB

export const maxAvatarDimension = 128

export const emailVerificationExpiryInSeconds = getUnitInSeconds(1, 'h')

export const emailVerificationExpiryInMs =
  emailVerificationExpiryInSeconds * 1000
