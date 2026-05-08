import type {ApiClient} from '@/client/types'
import type {ErrorContext} from '@/shared/types'

import {apiClientAtom} from '@/client/state/globalState'

import {bestEffort, errorToObject} from '@qodestack/utils'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'

/**
 * Persists a client-only error to the server's `errors` table via `/api/capture`.
 *
 * Use only for genuine client-side problems: catch-block exceptions (network
 * failures, unhandled JS errors), React error-boundary catches. Do NOT call
 * for normal API rejections (wrong password, validation 400s) — those are
 * expected UX, and any 5xx the server produced is captured server-side.
 */
function captureError({
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
      apiClient.capture.$post({
        json: {error: errorToObject(error), context, metadata},
      })
    },
    {log: true}
  )
}

export function useCaptureError() {
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
      captureError({error, context, metadata, apiClient})
    },
    [apiClient]
  )
}
