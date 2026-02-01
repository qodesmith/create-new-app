import {defaultAuthedPath, resetAppKey} from '@/client/constants'
import {isValidRoute} from '@/client/lib/isValidRoute'
import {authClientAtom} from '@/client/state/globalState'

import {createFileRoute, Outlet, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({context, location}) => {
    const authClient = context.store.get(authClientAtom)
    const session = await authClient.getSession()
    const {pathname} = location

    if (!(session.data?.session && session.data?.user)) {
      sessionStorage.setItem(resetAppKey, 'true')

      throw redirect({
        to: '/login',
        replace: true,
        search: {
          redirect: isValidRoute(pathname) ? pathname : defaultAuthedPath,
        },
      })
    }

    return {
      user: session.data.user,
      session: session.data.session,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section>
      <Outlet />
    </section>
  )
}
