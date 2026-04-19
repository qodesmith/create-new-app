import {useLogClientError} from '@/client/hooks/useLogClientError'
import {authClientAtom, isSignedInAtom} from '@/client/state/globalState'

import {useRouteContext} from '@tanstack/react-router'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useState} from 'react'

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const setIsSignedIn = useSetAtom(isSignedInAtom)
  const {resetApp} = useRouteContext({from: '__root__'})
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const signOut = useCallback(async () => {
    setIsSigningOut(true)

    try {
      const {data, error} = await authClient.signOut()
      const isSignedOut = !!data?.success

      if (isSignedOut) {
        resetApp()
      } else if (error) {
        logClientError({error, context: 'client:signOutRejection'})
      }

      setIsSignedIn(!isSignedOut)

      return isSignedOut
    } catch (error) {
      logClientError({error, context: 'client:signOutException'})
      return false
    } finally {
      setIsSigningOut(false)
    }
  }, [setIsSignedIn, resetApp, logClientError, authClient])

  return {signOut, isSigningOut}
}
