/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok here */

import type {errorContexts, userRoles} from '@/shared/constants'
import type {FileRouteTypes} from '../client/routeTree.gen'
import type {auth} from '../server/db/auth/auth'

export type * from '../server/types.d'

export type ClientRoute = FileRouteTypes['to']

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

export type SortDirection = 'asc' | 'desc'

export type Prettify<T> = T extends BuiltIn
  ? T
  : T extends Array<infer U>
    ? Prettify<U>[]
    : T extends object
      ? {[K in keyof T]: Prettify<T[K]>} & {}
      : T

export type ServerAuth = typeof auth

export type UserRole = keyof typeof userRoles

/**
 * Derived from the `errorContexts` array in shared/constants.ts, which is the
 * single source of truth. Add new values there; this union updates itself. See
 * that array for the `<service>:<operation>:<suffix>` naming convention.
 */
export type ErrorContext = (typeof errorContexts)[number]
