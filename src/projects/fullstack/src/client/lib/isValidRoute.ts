import type {createTanstackRouter} from '@/client/router'
import type {FileRoutesByTo} from '@/client/routeTree.gen'

export function isValidRoute(
  router: ReturnType<typeof createTanstackRouter>,
  path: string | undefined
): path is keyof FileRoutesByTo {
  if (!path) return false

  /**
   * We compute the set on each call instead of caching at the module scope:
   * 1. In dev, routes may change
   * 2. This is trivial work
   */
  const routePathsSet = new Set(
    Object.keys(router.buildRouteTree().routesByPath)
  )

  return routePathsSet.has(path)
}
