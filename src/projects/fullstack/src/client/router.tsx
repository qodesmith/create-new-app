import {AudioLoader} from '@/client/components/custom/AudioLoader'
import {ErrorState} from '@/client/components/custom/ErrorState'
import {Button} from '@/client/components/ui/button'
import {logClientError} from '@/client/lib/utils'
import {apiClientAtom} from '@/client/state/globalState'

import {createRouter, useRouter} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {useEffect} from 'react'

import {routeTree} from './routeTree.gen'

export function createTanstackRouter() {
  return createRouter({
    // @ts-expect-error context values will be passed into <RouterProvider context={...} />
    context: {}, // type is RouterContext
    routeTree,
    defaultPreload: 'intent',

    /**
     * Give components up to 100ms to load data before showing a loader.
     * 0 - 100 ms = feels immediate, users perceive no delay.
     */
    defaultPendingMs: 100,

    /**
     * When a loader is shown, show it for at least 300ms.
     * 100 - 300ms = slightly noticeable but tolerable.
     */
    defaultPendingMinMs: 300,
    defaultPendingComponent: () => {
      return (
        <div className="flex justify-center pt-20">
          <AudioLoader width={28} height={34} gap={2} rounded={2} />
        </div>
      )
    },

    // Catches errors in the component's loader and render cycle.
    defaultErrorComponent: ({error, info, reset: resetErrorBoundary}) => {
      const apiClient = useAtomValue(apiClientAtom)
      const isValidationError = 'code' in error && error.code === 'validation'
      const title = isValidationError
        ? 'Data failed to load'
        : 'Something went wrong'
      const {invalidate} = useRouter() // Will invalidate the current route's cache
      const onClick = () => {
        isValidationError
          ? invalidate() // Reloads the loader and resets the error boundary
          : resetErrorBoundary() // Only resets the error boundary
      }

      useEffect(() => {
        logClientError({
          error,
          context: 'client:topLevel',
          metadata: info,
          apiClient,
        })
      }, [error, info, apiClient])

      return (
        <ErrorState
          title={title}
          actions={
            <div className="flex justify-center">
              <Button onClick={onClick}>
                {isValidationError ? 'Retry' : 'Reset'}
              </Button>
            </div>
          }
        />
      )
    },

    defaultNotFoundComponent: () => {
      return (
        <div className="pt-20 text-center">
          <h1 className="text-7xl">😅</h1>
          <div className="pt-3">Nothing found here</div>
        </div>
      )
    },
  })
}
