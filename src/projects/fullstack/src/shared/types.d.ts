/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

import type {auth} from '../server/db/auth/auth'

export type * from '../server/types.d'

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

type BuiltIn =
  | Date
  | RegExp
  | Error
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | Promise<any>
  | ArrayBuffer
  | ((...args: any[]) => any)

export type Prettify<T> = T extends BuiltIn
  ? T
  : T extends Array<infer U>
    ? Prettify<U>[]
    : T extends object
      ? {[K in keyof T]: Prettify<T[K]>} & {}
      : T

export type ServerAuth = typeof auth
