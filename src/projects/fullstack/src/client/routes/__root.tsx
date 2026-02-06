import type {RouterContext} from '@/client/types'

import {Toaster} from '@/client/components/ui/sonner'
import {themeAtom, themeSettingAtom} from '@/client/state/globalState'

import {createRootRouteWithContext, Outlet} from '@tanstack/react-router'
import {useAtomValue, useSetAtom} from 'jotai'
import {lazy, useLayoutEffect} from 'react'

const _TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in developmente
        import('@tanstack/react-router-devtools').then(res => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        }))
      )

export const Route = createRootRouteWithContext<RouterContext>()({
  /**
   * This route is ALWAYS rendered and ALWAYS matched. This route is the
   * top-most route in the entire application.
   */
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      {/* Content here will show on EVERY page */}
      <Toaster richColors visibleToasts={3} closeButton />
      <ThemeSetter />

      {/* Renders the current route's content  */}
      <Outlet />

      {/* Will NOT show in production */}
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}

function ThemeSetter() {
  const themeSetting = useAtomValue(themeSettingAtom)
  const setTheme = useSetAtom(themeAtom)

  useLayoutEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    if (themeSetting === 'system') {
      const newTheme = mediaQuery.matches ? 'dark' : 'light'

      setTheme(newTheme)
      root.classList.add(newTheme)
    } else {
      setTheme(themeSetting)
      root.classList.add(themeSetting)
    }

    function handler(e: MediaQueryListEvent) {
      const newTheme = e.matches ? 'dark' : 'light'

      setTheme(newTheme)
      root.classList.remove('light', 'dark')
      root.classList.add(newTheme)
    }

    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [themeSetting, setTheme])

  return null
}
