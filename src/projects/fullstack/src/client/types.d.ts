import type {QueryClient} from '@tanstack/react-query'
import type {Store} from 'jotai/vanilla/store'
import type {
  getApiAuthClient,
  getApiClient,
  getAuthClient,
} from '@/client/apiClient'
import type {createTanstackRouter} from '@/client/router'

export type RouterContext = {
  resetApp: () => void
  router: ReturnType<typeof createTanstackRouter>
  store: Store
  queryClient: QueryClient
}

export type ApiClient = ReturnType<typeof getApiClient>

export type ApiAuthClient = ReturnType<typeof getApiAuthClient>

export type AuthClient = ReturnType<typeof getAuthClient>

export type User = AuthClient['$Infer']['Session']['user']
