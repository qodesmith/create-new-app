import {defaultAuthedPath} from '@/client/constants'
import {authClientAtom} from '@/client/state/globalState'

import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  beforeLoad: async ({context}) => {
    const authClient = context.store.get(authClientAtom)
    const {data} = await authClient.getSession()

    if (data) {
      throw redirect({to: defaultAuthedPath, replace: true})
    }
  },
})
