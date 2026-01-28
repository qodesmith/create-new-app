import {log} from '@/server/utils/logger'

import {errorToObject} from '@qodestack/utils'

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
