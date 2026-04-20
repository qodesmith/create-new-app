import type {ApiClient} from '@/client/types'
import type {ErrorContext} from '@/shared/types'

import {apiClientAtom} from '@/client/state/globalState'

import {bestEffort, errorToObject} from '@qodestack/utils'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'

/**
 * Logs client-side errors to the server for centralized error tracking.
 *
 * @param error - The error object or unknown value to be logged
 * @param context - Used for observability and debugging in the logs
 * @param metadata - Optional adhoc data with no specific shape, used to provide additional context
 */
function logClientError({
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
  bestEffort(
    () => {
      apiClient['client-error'].$post({
        json: {error: errorToObject(error), context, metadata},
      })
    },
    {log: true}
  )
}

export function useLogClientError() {
  const apiClient = useAtomValue(apiClientAtom)

  return useCallback(
    ({
      error,
      context,
      metadata,
    }: {
      error: Error | unknown
      context: ErrorContext
      metadata?: Record<string, unknown>
    }) => {
      logClientError({error, context, metadata, apiClient})
    },
    [apiClient]
  )
}
