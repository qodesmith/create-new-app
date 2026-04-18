import type {AnyFormApi} from '@tanstack/react-form'
import type {ClassValue} from 'clsx'
import type {ApiClient} from '@/client/types'
import type {ErrorContext} from '@/shared/types'

import {errorToObject, noop} from '@qodestack/utils'
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
 * Logs client-side errors to the server for centralized error tracking.
 *
 * @param error - The error object or unknown value to be logged
 * @param context - Used for observability and debugging in the logs
 * @param metadata - Optional adhoc data with no specific shape, used to provideadditional context
 */
export function logClientError({
  error,
  context,
  metadata,
  apiClient,
}: {
  error: Error | unknown
  context: ErrorContext
  metadata?: Record<string, unknown>
  apiClient: ApiClient
}): void {
  void apiClient['client-error']
    .$post({
      json: {error: errorToObject(error), context, metadata},
    })

    /**
     * This function is a best-effort "fire and forget" error handler. If it
     * fails, there's nothing left to do.
     */
    .catch(noop)
}

/**
 * Helper to automatically create an error toast for all errors found on a
 * Tanstack form in the onSubmitInvalid handler in useForm.
 */
export const handleFormSubmitInvalid = ({formApi}: {formApi: AnyFormApi}) => {
  Object.values(formApi.getAllErrors().fields).forEach(field => {
    field.errors.forEach(errorMessage => {
      if (typeof errorMessage === 'string') {
        toast.error(errorMessage)
      }
    })
  })
}
