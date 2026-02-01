import type {FileRoutesByTo} from '@/client/routeTree.gen'

import {matchRoutes} from '@/client/router'

export function isValidRoute(
  pathname: string
): pathname is keyof FileRoutesByTo {
  const matches = matchRoutes(pathname)

  if (
    // There will always be a single match for '__root__' - ignore this.
    matches.length <= 1 ||
    /**
     * More specific matches start at the end of the array. If there's a
     * partial match in the pathname, the rest of the "unmatched" portion will
     * get dumped into params as {'**': <unmatched>}.
     */
    '**' in (matches.at(-1)?.params ?? {})
  ) {
    return false
  }

  return true
}
