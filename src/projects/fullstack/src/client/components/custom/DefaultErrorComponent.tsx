import type {ErrorRouteComponent} from '@tanstack/react-router'
import type {ComponentProps} from 'react'

import {ErrorState} from '@/client/components/custom/ErrorState'
import {Button} from '@/client/components/ui/button'
import {useLogClientError} from '@/client/hooks/useLogClientError'

import {useRouter} from '@tanstack/react-router'
import {useEffect} from 'react'

export function DefaultErrorComponent({
  error,
  info,
  reset: resetErrorBoundary,
}: ComponentProps<ErrorRouteComponent>) {
  const logClientError = useLogClientError()
  const isValidationError = 'code' in error && error.code === 'validation'
  const title = isValidationError
    ? 'Data failed to load'
    : 'Something went wrong'
  const {invalidate} = useRouter() // Will invalidate the current route's cache
  const onClick = () => {
    if (isValidationError) {
      invalidate() // Reloads the loader and resets the error boundary
    } else {
      resetErrorBoundary() // Only resets the error boundary
    }
  }

  useEffect(() => {
    logClientError({
      error,
      context: 'client:topLevel:exception',
      metadata: info,
    })
  }, [logClientError, info, error])

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
}
