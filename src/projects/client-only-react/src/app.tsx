/**
 * This file is the entry point for the React app. It sets up the root element
 * and renders it to the DOM.
 *
 * This file is included in `index.html` which enables Bun to traverse the
 * dependency tree to build the application.
 */

import type {RouterContext} from '@/types'

import {useStable} from '@/hooks/useStable'
import {createQueryClient} from '@/queryClient'
import {createTanstackRouter} from '@/router'

import {QueryClientProvider} from '@tanstack/react-query'
import {RouterProvider} from '@tanstack/react-router'
import {createStore, Provider as JotaiProvider} from 'jotai'
import {StrictMode, useState} from 'react'
import {createRoot} from 'react-dom/client'

import '@/app.css'

// biome-ignore lint/style/useComponentExportOnlyModules: it's ok here
function AppContainer() {
  const [store, setStore] = useState(() => createStore())
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

function start() {
  const root = createRoot(document.getElementById('root') as Element)

  root.render(
    <StrictMode>
      <AppContainer />
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
  start()
}
