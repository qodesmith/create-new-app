import {AudioLoader} from '@/client/components/custom/AudioLoader'
import {DefaultErrorComponent} from '@/client/components/custom/DefaultErrorComponent'

import {createRouter} from '@tanstack/react-router'

import {routeTree} from './routeTree.gen'

export function createTanstackRouter() {
  return createRouter({
    // @ts-expect-error context values will be passed into <RouterProvider context={...} />
    context: {}, // type is RouterContext
    routeTree,
    defaultPreload: 'intent',

    /**
     * Give components up to 100ms to load data before showing a loader.
     * 0 - 100 ms = feels immediate, users perceive no delay.
     */
    defaultPendingMs: 100,

    /**
     * When a loader is shown, show it for at least 300ms.
     * 100 - 300ms = slightly noticeable but tolerable.
     */
    defaultPendingMinMs: 300,
    defaultPendingComponent: () => {
      return (
        <div className="flex justify-center pt-20">
          <AudioLoader width={28} height={34} gap={2} rounded={2} />
        </div>
      )
    },

    // Catches errors in the component's loader and render cycle.
    defaultErrorComponent: DefaultErrorComponent,

    defaultNotFoundComponent: () => {
      return (
        <div className="pt-20 text-center">
          <h1 className="text-7xl">😅</h1>
          <div className="pt-3">Nothing found here</div>
        </div>
      )
    },
  })
}
