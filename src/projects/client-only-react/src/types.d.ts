/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

import type {QueryClient} from '@tanstack/react-query'
import type {Store} from 'jotai/vanilla/store'
import type {createTanstackRouter} from '@/router'

export type RouterContext = {
  resetApp: () => void
  router: ReturnType<typeof createTanstackRouter>
  store: Store
  queryClient: QueryClient
}

declare global {
  namespace NodeJS {
    // biome-ignore lint/style/useConsistentTypeDefinitions: it's ok
    interface ProcessEnv {
      // biome-ignore-start lint/style/useNamingConvention: env vars are ok
      NODE_ENV: 'development' | 'production' | 'test'
      // biome-ignore-end lint/style/useNamingConvention: env vars are ok
    }
  }
}

export type Prettify<T> = T extends Date
  ? T
  : T extends Record<any, any>
    ? {[K in keyof T]: Prettify<T[K]>} & {}
    : T
