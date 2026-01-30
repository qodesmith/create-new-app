import type {ClassValue} from 'clsx'
import type {FileRoutesByTo} from '@/client/routeTree.gen'
import type {ApiClient} from '@/client/types'
import type {ErrorContext} from '@/shared/types'

import {matchRoutes} from '@/client/router'

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
 * Get the value of a cookie by name.
 */
export function getCookie(name: string) {
  // '; key1=value1; key2=value2; key3=value3'
  const value = `; ${document.cookie}`

  /**
   * Looking for 'key2' would return:
   * ['; key1=value1', 'value2; key3=value3']
   */
  const parts = value.split(`; ${name}=`)

  /**
   * pop()      => 'value2; key3=value3'
   * split(':') => ['value2', ' key3=value3']
   * .shift()   => 'value2'
   */
  return parts.length === 2 ? parts.pop()?.split(';').shift() : undefined
}

export function isValidRoute(
  pathname: string
): pathname is keyof FileRoutesByTo {
  const matches = matchRoutes(pathname)

  if (
    // There will always be a single match for '__root__' - ignore this.
    matches.length <= 1 ||
    /**
     * More specific matches start at the end of the array. If there's a
     * partial match in the pathname, the rest of the "unmatched" portion will
     * get dumped into params as {'**': <unmatched>}.
     */
    '**' in (matches.at(-1)?.params ?? {})
  ) {
    return false
  }

  return true
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
export const handleFormSubmitInvalid = ({
  formApi,
}: {
  formApi: {getAllErrors: () => {fields: Record<string, {errors: unknown[]}>}}
}) => {
  Object.values(formApi.getAllErrors().fields).forEach(field => {
    field.errors.forEach((errorMessage: unknown) => {
      if (typeof errorMessage === 'string') {
        toast.error(errorMessage)
      }
    })
  })
}
