import type {SearchSchemaInput} from '@tanstack/react-router'

import {defaultAuthedPath} from '@/client/constants'
import {authClientAtom} from '@/client/state/globalState'

import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (
    /**
     * Using `<type> & SearchSchemaInput` is TanStack Router's way of making
     * query params optional when using the <Link /> component. Otherwise,
     * `search` will be a required prop for the Link.
     */
    search: {token?: string} & SearchSchemaInput
  ): {token: string | undefined} => {
    /**
     * https://www.better-auth.com/docs/authentication/email-password#request-password-reset
     *
     * Better Auth will append either `token` or `error` query params to this
     * url when the user is redirected here from the reset-password email. If
     * the token isn't valid or is expired, only `error` will be in the query
     * param.
     */
    return {token: search.token}
  },
  beforeLoad: async ({context}) => {
    const authClient = context.store.get(authClientAtom)
    const {data} = await authClient.getSession()

    if (data) {
      throw redirect({to: defaultAuthedPath, replace: true})
    }
  },
})
