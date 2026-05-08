/**
 * This file is the entry point for the React app. It sets up the root element
 * and renders it to the DOM.
 *
 * This file is included in `src/index.html` which enables Bun to traverse the
 * dependency tree to build the application.
 */

import type {RouterContext, User} from '@/client/types'

import {getAuthClient} from '@/client/apiClient'
import {useStable} from '@/client/hooks/useStable'
import {createQueryClient} from '@/client/queryClient'
import {createTanstackRouter} from '@/client/router'

import {QueryClientProvider} from '@tanstack/react-query'
import {RouterProvider} from '@tanstack/react-router'
import {createStore, Provider as JotaiProvider} from 'jotai'
import {StrictMode, useState} from 'react'
import {createRoot} from 'react-dom/client'

import '@/client/app.css'
import {userAtom} from '@/client/state/globalState'

async function start() {
  const root = createRoot(document.getElementById('root') as Element)
  const authClient = getAuthClient()
  const sessionData = await authClient.getSession()

  function AppContainer({user}: {user: User | null}) {
    const [store, setStore] = useState(() => {
      const s = createStore()
      s.set(userAtom, user)
      return s
    })
    const router = useStable(() => createTanstackRouter())
    const queryClient = useStable(() => createQueryClient())
    const resetApp = useStable(() => {
      return () => {
        setStore(createStore())
        router.clearCache()
        router.invalidate()
        queryClient.clear() // Clear all connected caches.
        void queryClient.cancelQueries(undefined, {silent: true})
      }
    })

    // Route context is available within route loaders.
    const context: RouterContext = {router, store, queryClient, resetApp}

    return (
      <QueryClientProvider client={queryClient}>
        <JotaiProvider store={store}>
          <RouterProvider router={router} context={context} />
        </JotaiProvider>
      </QueryClientProvider>
    )
  }

  root.render(
    <StrictMode>
      <AppContainer user={sessionData?.data?.user ?? null} />
    </StrictMode>
  )
}

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: it's ok here
  interface Register {
    router: ReturnType<typeof createTanstackRouter>
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start)
} else {
  void start()
}
