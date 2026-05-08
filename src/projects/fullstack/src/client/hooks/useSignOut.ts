import {useCaptureError} from '@/client/hooks/useCaptureError'
import {authClientAtom, isSignedInAtom} from '@/client/state/globalState'

import {useRouteContext} from '@tanstack/react-router'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useState} from 'react'

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const setIsSignedIn = useSetAtom(isSignedInAtom)
  const {resetApp} = useRouteContext({from: '__root__'})
  const authClient = useAtomValue(authClientAtom)
  const captureError = useCaptureError()
  const signOut = useCallback(async () => {
    setIsSigningOut(true)

    try {
      const {data} = await authClient.signOut()
      const isSignedOut = !!data?.success

      if (isSignedOut) resetApp()
      setIsSignedIn(!isSignedOut)

      return isSignedOut
    } catch (error) {
      captureError({error, context: 'client:signOut:exception'})
      return false
    } finally {
      setIsSigningOut(false)
    }
  }, [setIsSignedIn, resetApp, captureError, authClient])

  return {signOut, isSigningOut}
}
