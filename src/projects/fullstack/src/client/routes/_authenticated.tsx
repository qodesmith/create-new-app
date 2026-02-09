import {defaultAuthedPath, resetAppKey} from '@/client/constants'
import {isValidRoute} from '@/client/lib/isValidRoute'
import {authClientAtom, isSignedInAtom} from '@/client/state/globalState'

import {createFileRoute, Outlet, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({context, location}) => {
    const authClient = context.store.get(authClientAtom)
    const session = await authClient.getSession()
    const {pathname} = location

    if (!(session.data?.session && session.data?.user)) {
      sessionStorage.setItem(resetAppKey, 'true')
      context.store.set(isSignedInAtom, false)

      throw redirect({
        to: '/signin',
        replace: true,
        search: {
          redirect: isValidRoute(context.router, pathname)
            ? pathname
            : defaultAuthedPath,
        },
      })
    }

    context.store.set(isSignedInAtom, true)

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
