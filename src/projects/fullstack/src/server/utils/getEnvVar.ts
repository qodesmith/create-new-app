import process from 'node:process'

export function getEnvVar<K extends keyof NodeJS.ProcessEnv>(
  key: K,
  options?: {shouldThrow?: true}
): string

export function getEnvVar<K extends keyof NodeJS.ProcessEnv>(
  key: K,
  options: {shouldThrow: false}
): string | undefined

export function getEnvVar<K extends keyof NodeJS.ProcessEnv>(
  key: K,
  {shouldThrow = true}: {shouldThrow?: boolean} = {}
): string | undefined {
  const value = process.env[key]

  if (shouldThrow && value === undefined) {
    throw new Error(`No value for ${key} env var found.`)
  }

  return value
}
