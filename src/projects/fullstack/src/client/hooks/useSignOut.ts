import {useLogClientError} from '@/client/hooks/useLogClientError'
import {authClientAtom, userAtom} from '@/client/state/globalState'

import {useRouteContext} from '@tanstack/react-router'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useState} from 'react'

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const setUser = useSetAtom(userAtom)
  const {resetApp} = useRouteContext({from: '__root__'})
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const signOut = useCallback(async () => {
    setIsSigningOut(true)

    try {
      const {data} = await authClient.signOut()
      const isSignedOut = !!data?.success

      if (isSignedOut) {
        resetApp()
      }

      setUser(null)

      return isSignedOut
    } catch (error) {
      logClientError({error, context: 'client:signOut:exception'})
      return false
    } finally {
      setIsSigningOut(false)
    }
  }, [setUser, resetApp, logClientError, authClient.signOut])

  return {signOut, isSigningOut}
}
