import {defaultAuthedPath, resetAppKey} from '@/client/constants'
import {isValidRoute} from '@/client/lib/isValidRoute'
import {authClientAtom, isSignedInAtom} from '@/client/state/globalState'

import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import {useEffect} from 'react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({context, location}) => {
    const authClient = context.store.get(authClientAtom)
    const session = await authClient.getSession()
    const {pathname} = location

    if (!session.data) {
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
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()

  /**
   * Re-validate the session when the tab regains focus. TanStack Router's
   * `beforeLoad` only runs on navigation, so a stale tab (e.g. after account
   * deletion or sign-out in another tab/browser) would keep displaying the
   * protected page until the next navigation or full refresh.
   *
   * `router.invalidate()` re-runs all active route loaders, including the
   * `beforeLoad` guard above, which checks the session against the database
   * and redirects to `/signin` if it's gone.
   *
   * TanStack Router has no built-in revalidate-on-focus mechanism (unlike
   * TanStack Query's `refetchOnWindowFocus`), so we handle it manually.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void router.invalidate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router])

  return (
    <section>
      <Outlet />
    </section>
  )
}
