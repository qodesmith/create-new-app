import type {ApiClient} from '@/client/types'
import type {ErrorContext} from '@/shared/errorContext'

import {apiClientAtom} from '@/client/state/globalState'

import {bestEffort, errorToObject} from '@qodestack/utils'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'

function captureClientError({
  error,
  context,
  metadata,
  apiClient,
}: {
  error: unknown
  context: ErrorContext
  metadata?: Record<string, unknown>
  apiClient: ApiClient
}): void {
  bestEffort(
    () => {
      apiClient['error-captures'].$post({
        json: {error: errorToObject(error), context, metadata},
      })
    },
    {log: true}
  )
}

/**
 * Captures browser-originated errors that the server cannot observe directly.
 */
export function useCaptureError() {
  const apiClient = useAtomValue(apiClientAtom)

  return useCallback(
    ({
      error,
      context,
      metadata,
    }: {
      error: unknown
      context: ErrorContext
      metadata?: Record<string, unknown>
    }) => {
      captureClientError({error, context, metadata, apiClient})
    },
    [apiClient]
  )
}
