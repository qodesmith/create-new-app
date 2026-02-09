import type {createTanstackRouter} from '@/client/router'
import type {FileRoutesByTo} from '@/client/routeTree.gen'

export function isValidRoute(
  router: ReturnType<typeof createTanstackRouter>,
  path: string | undefined
): path is keyof FileRoutesByTo {
  if (!path) return false

  const routePathsSet = new Set(
    Object.keys(router.buildRouteTree().routesByPath)
  )

  return routePathsSet.has(path)
}
