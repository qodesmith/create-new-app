import type {HonoAuthServer, HonoServer, ServerAuth} from '@/shared/types'

import {authRoutePath, betterAuthBasePath} from '@/shared/constants'

import {passkeyClient} from '@better-auth/passkey/client'
import {adminClient, inferAdditionalFields} from 'better-auth/client/plugins'
import {createAuthClient} from 'better-auth/react'
import {hc} from 'hono/client'

/**
 * https://hono.dev/docs/guides/rpc
 *
 * All endpoints provided by the Hono server are strongly typed and available
 * for consumption here. Example:
 *
 * ```typescript
 * const users = await apiClient.users.$get().then(res => res.json())
 * ```
 */
export function getApiClient() {
  return hc<HonoServer>(
    typeof window === 'undefined' ? '' : window.location.origin,

    // Send cookies with every request.
    {init: {credentials: 'include'}}
  ).api
}

// Authenticated api routes
export function getApiAuthClient() {
  return hc<HonoAuthServer>(
    `${typeof window === 'undefined' ? '' : window.location.origin}${authRoutePath}`,

    // Send cookies with every request.
    {init: {credentials: 'include'}}
  )
}

// Better-auth routes
function createAuthClientInstance() {
  return createAuthClient({
    basePath: betterAuthBasePath,
    plugins: [
      // https://www.better-auth.com/docs/concepts/typescript#inferring-additional-fields-on-client
      inferAdditionalFields<ServerAuth>(),

      // https://www.better-auth.com/docs/plugins/passkey#add-the-client-plugin
      passkeyClient(),

      // https://www.better-auth.com/docs/plugins/admin#add-the-client-plugin
      adminClient(),
    ],
  })
}

let authClientSingleton: ReturnType<typeof createAuthClientInstance> | undefined

export function getAuthClient() {
  /**
   * SSR-safe: only memoize in the browser so server renders get a fresh
   * per-request client and don't leak session state between users.
   */
  if (typeof window === 'undefined') return createAuthClientInstance()

  authClientSingleton ??= createAuthClientInstance()
  return authClientSingleton
}
