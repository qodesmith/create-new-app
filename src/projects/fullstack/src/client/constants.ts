import type {FileRouteTypes} from '@/client/routeTree.gen'

/**
 * This key is set in sessionStorage and is used to trigger resetting app state
 * when no authenticated user is found at the root authenticated route.
 */
export const resetAppKey = 'reset-app'


export const defaultAuthedPath = '/account' satisfies FileRouteTypes['to']
