import type {FileRoutesByTo} from '@/client/routeTree.gen'

import {defaultAuthedPath, resetAppKey} from '@/client/constants'
import {isValidRoute} from '@/client/lib/isValidRoute'
import {authClientAtom, isSignedInAtom} from '@/client/state/globalState'

import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/signin')({
  beforeLoad: async ({context}) => {
    const shouldResetApp = sessionStorage.getItem(resetAppKey) === 'true'

    if (shouldResetApp) {
      sessionStorage.removeItem(resetAppKey)
      context.resetApp()
    }

    const authClient = context.store.get(authClientAtom)
    const session = await authClient.getSession()

    if (session.data?.session) {
      context.store.set(isSignedInAtom, true)
      throw redirect({to: defaultAuthedPath, replace: true})
    }
  },
  validateSearch: (
    search: Record<string, unknown>
  ): {redirect?: keyof FileRoutesByTo} | undefined => {
    if (typeof search.redirect === 'string') {
      return {
        redirect: isValidRoute(search.redirect)
          ? search.redirect
          : defaultAuthedPath,
      }
    }
  },
})
