import {getEnvVar} from '@/server/utils/getEnvVar'

import {getUnitInMs} from '@qodestack/utils'

export const port = getEnvVar('PORT')

export const domain = getEnvVar('DOMAIN') // 'example.com'
export const origin = `https://${domain}` as const
const originWww = `https://www.${domain}`
export const localhost = `http://localhost:${port}` as const

const flyAppName = getEnvVar('FLY_APP_NAME', {shouldThrow: false})
export const prodOriginList = flyAppName
  ? [origin, originWww, `https://${flyAppName}.fly.dev`]
  : [origin, originWww]
export const localOriginList = [localhost, `http://0.0.0.0:${port}`]

// Add new user roles by adding matching key/value pairs.
export const userRoles = Object.freeze({
  admin: 'admin',
  user: 'user',
})

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
export const isProd = isProdEnv && !isLocalContainer

const _intendingToExposeAllLocalConnections =
  getEnvVar('ALL_CONNECTIONS', {shouldThrow: false}) === 'true'

/**
 * This variable is set in the `dev:all` npm script to trigger the app running
 * locally at `http://0.0.0.0:<port>`
 */
export const is0000 = !isProd && _intendingToExposeAllLocalConnections

export const errorRetentionPeriod = getUnitInMs(90, 'd')

export const auditLogRetentionPeriod = getUnitInMs(1, 'y')

/**
 * This should never happen, but just a safeguard in case it does.
 * ALL_CONNECTIONS is a dev-only flag that binds the server to 0.0.0.0, exposing
 * it on all network interfaces for local mobile testing. In production, the
 * server's network exposure should be managed by the deployment infrastructure,
 * not by an env variable.
 */
if (isProd && _intendingToExposeAllLocalConnections) {
  throw new Error('ALL_CONNECTIONS must not be set to "true" in production.')
}
