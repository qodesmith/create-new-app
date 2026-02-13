import type {RouterContext} from '@/client/types'

import {AppHeader} from '@/client/components/custom/AppHeader'
import {Toaster} from '@/client/components/ui/sonner'
import {
  _themeAtom_INTERNAL_USE_ONLY,
  themeSettingAtom,
} from '@/client/state/globalState'

import {createRootRouteWithContext, Outlet} from '@tanstack/react-router'
import {useAtomValue, useSetAtom} from 'jotai'
import {lazy, useLayoutEffect} from 'react'

const TanStackRouterDevtools =
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
      <AppHeader />
      <Outlet />

      {/* Will NOT show in production */}
      <TanStackRouterDevtools />
    </>
  )
}

function ThemeSetter() {
  const setTheme = useSetAtom(_themeAtom_INTERNAL_USE_ONLY)
  const themeSetting = useAtomValue(themeSettingAtom)

  useLayoutEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme(isDark: boolean) {
      const newTheme = isDark ? 'dark' : 'light'

      setTheme(newTheme)
      root.classList.remove('light', 'dark')
      root.classList.add(newTheme)
    }

    if (themeSetting === 'system') {
      applyTheme(mediaQuery.matches)

      function handler(e: MediaQueryListEvent) {
        applyTheme(e.matches)
      }

      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }

    applyTheme(themeSetting === 'dark')
  }, [themeSetting, setTheme])

  return null
}
