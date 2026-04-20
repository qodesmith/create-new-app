import {QueryCache, QueryClient} from '@tanstack/react-query'
import {notFound} from '@tanstack/react-router'
import {DetailedError} from 'hono/client'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (
            error instanceof DetailedError &&
            error.statusCode >= 400 &&
            error.statusCode < 500
          ) {
            return false
          }

          return failureCount < 3
        },
      },
    },
    queryCache: new QueryCache({
      onError: error => {
        /**
         * `queryFn`'s that use `apiAuthClient` or `apiClient` should be
         * wrapped in Hono's `parseResponse` utility function that will throw
         * a `DetailedError` containing a status code.
         */
        if (error instanceof DetailedError && error.statusCode === 404) {
          throw notFound()
        }
      },
    }),
  })
}
