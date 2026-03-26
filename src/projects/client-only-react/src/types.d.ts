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

/**
 * Maps an `as const` string array into an object where keys equals the values.
 * T must be a readonly string array (i.e. declared with `as const`).
 */
export type MirrorMap<T extends readonly string[]> = {[K in T[number]]: K}

export type DateToString<T> = T extends Date
  ? string
  : T extends Record<any, any>
    ? {[K in keyof T]: DateToString<T[K]>}
    : T
