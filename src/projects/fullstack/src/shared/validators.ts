import {
  minPasswordLength,
  nameRegex,
  nameValidationMessage,
} from '@/shared/constants'

import {type} from 'arktype'

export const emailValidator = type('string.email')
export const passwordValidator = type(`string >= ${minPasswordLength}`)
export const nameValidator = type(nameRegex)

/**
 * Framework-agnostic person's-name check shared by every form. Returns an error
 * message — prefixed with a field `label` ('First name' | 'Last name') when one
 * is given — or undefined when valid. `nameValidator` above is just arktype over
 * this same `nameRegex`, so this single regex test is the whole check.
 */
export function validateName(
  value: string,
  label?: string
): string | undefined {
  if (nameRegex.test(value)) return undefined
  return label ? `${label} ${nameValidationMessage}` : nameValidationMessage
}
