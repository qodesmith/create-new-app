import {log} from '@/server/utils/logger'

import {errorToObject} from '@qodestack/utils'

/**
 * Executes a callback and swallows any errors, logging them instead of throwing.
 * Useful for non-critical operations where failure shouldn't break the flow.
 *
 * @param cb - Sync or async callback to execute
 * @returns The callback result, or undefined if an error occurred
 */
export function bestEffort<T>(cb: () => Promise<T>): Promise<T | undefined>
export function bestEffort<T>(cb: () => T): T | undefined
export function bestEffort<T>(cb: (() => T) | (() => Promise<T>)) {
  try {
    const result = cb()

    if (result instanceof Promise) {
      return result
        .then(res => res as T)
        .catch(error => {
          log.error('[BEST EFFORT (promise)]', errorToObject(error))
        })
    }

    return result
  } catch (error) {
    log.error('[BEST EFFORT]', errorToObject(error))
  }
}
