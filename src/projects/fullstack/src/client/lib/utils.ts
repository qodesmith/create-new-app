import type {AnyFormApi} from '@tanstack/react-form'
import type {ClassValue} from 'clsx'
import type {User} from '@/client/types'

import {serverValidationErrorCode} from '@/shared/constants'

import {clsx} from 'clsx'
import {toast} from 'sonner'
import {twMerge} from 'tailwind-merge'

/**
 * Uses clsx and twMerge to handle classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Derives display initials from a user's first + last name, falling back to
 * 'U' when neither is set. Casing is left to the caller (consumers typically
 * add an `uppercase` class on the avatar fallback).
 */
export function getUserInitials(user: Pick<User, 'name' | 'lastName'>) {
  const first = user.name.trim()[0] ?? ''
  const last = user.lastName.trim()[0] ?? ''
  return `${first}${last}` || 'U'
}

/**
 * Better Auth surfaces two kinds of errors to the client: the validation errors
 * we throw ourselves from the server `before` hook (auth.ts), and
 * library-generated errors (e.g. "User already exists"). We only want to
 * display the former — library messages can leak implementation details.
 *
 * Our server tags its own errors with `serverValidationErrorCode`, so we
 * surface `error.message` only when that marker is present and fall back to
 * the provided default message for everything else.
 */
export function getSafeAuthErrorMessage(
  error: {code?: string; message?: string},
  fallbackMessage: string
) {
  return error.code === serverValidationErrorCode && error.message
    ? error.message
    : fallbackMessage
}

/**
 * Helper for the onSubmitInvalid handler in useForm. Renders a single error
 * toast summarizing the form's validation errors: the message itself when
 * there's only one, or a count when there are multiple.
 */
export const handleFormSubmitInvalid = ({formApi}: {formApi: AnyFormApi}) => {
  const messages = Object.values(formApi.getAllErrors().fields)
    .flatMap(field => field.errors)
    .filter((error): error is string => typeof error === 'string')

  if (messages.length === 0) return

  if (messages.length === 1) {
    toast.error(messages[0])
    return
  }

  toast.error(`Please fix ${messages.length} errors in the form`)
}
