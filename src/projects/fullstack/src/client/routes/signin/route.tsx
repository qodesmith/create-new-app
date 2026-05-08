import type {SearchSchemaInput} from '@tanstack/react-router'

import {defaultAuthedPath, resetAppKey} from '@/client/constants'
import {authClientAtom, userAtom} from '@/client/state/globalState'

import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/signin')({
  validateSearch: (
    /**
     * Using `<type> & SearchSchemaInput` is TanStack Router's way of making
     * query params optional when using the <Link /> component. Otherwise,
     * `search` will be a required prop for the Link.
     */
    search: {redirect?: string; dialogInitialOpen?: boolean} & SearchSchemaInput
  ): {redirect?: string; dialogInitialOpen?: boolean} => {
    return {
      dialogInitialOpen: search.dialogInitialOpen,
      redirect: search.redirect,
    }
  },
  beforeLoad: async ({context}) => {
    const shouldResetApp = sessionStorage.getItem(resetAppKey) === 'true'

    if (shouldResetApp) {
      sessionStorage.removeItem(resetAppKey)
      context.resetApp()
    }

    const authClient = context.store.get(authClientAtom)
    const {data} = await authClient.getSession()

    if (data) {
      context.store.set(userAtom, data.user)
      throw redirect({to: defaultAuthedPath, replace: true})
    }
  },
})
