import {defaultAuthedPath, resetAppKey} from '@/client/constants'
import {authClientAtom, isSignedInAtom} from '@/client/state/globalState'

import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/signin')({
  validateSearch: (search): {redirect?: string} => {
    return {
      redirect:
        typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
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
})
