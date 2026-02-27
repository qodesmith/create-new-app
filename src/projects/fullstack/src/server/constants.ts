import type {MirrorMap} from '@/shared/types'

import {getEnvVar} from './utils/getEnvVar'

export const port = getEnvVar('PORT')

// TODO - update these variables with your actual domain name.
export const domain = '{{PROJECT_NAME}}.com' as const
export const origin = 'https://{{PROJECT_NAME}}.com' as const
export const originWww = 'https://www.{{PROJECT_NAME}}.com' as const

export const localhost = `http://localhost:${port}` as const

export const localhost0 = `http://0.0.0.0:${port}` as const

// Add new user roles by adding strings to this array. Keep `as const`!
const _userRoles = ['admin', 'user'] as const

export const userRoles = _userRoles.reduce(
  (acc, role) => {
    // @ts-expect-error - TS can't correlate that key and value are the same K
    acc[role] = role
    return acc
  },
  {} as MirrorMap<typeof _userRoles>
)

/**
 * This variable is set in the `dev:all` npm script to trigger the app running
 * locally at `http://0.0.0.0:<port>`
 */
export const is0000 =
  getEnvVar('ALL_CONNECTIONS', {shouldThrow: false}) === 'true'

/**
 * This variable is set inside Dockerfile.local. This Dockerfile is meant to
 * bundle the app in a production environment but be run locally.
 */
const isLocalContainer =
  getEnvVar('IS_LOCAL_CONTAINER', {
    shouldThrow: false,
  }) === 'true'

const nodeEnv = getEnvVar('NODE_ENV')

/**
 * `NODE_ENV === 'production'`
 */
export const isProdEnv = nodeEnv === 'production'

/**
 * Indicates whether the app is running in the __deployed production
 * environment__ or not. To _only_ read the `NODE_ENV` variable, use `nodeEnv`.
 */
export const isProd = isProdEnv && !is0000 && !isLocalContainer
