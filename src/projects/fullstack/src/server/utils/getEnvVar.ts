import process from 'node:process'

export function getEnvVar<K extends keyof NodeJS.ProcessEnv>(
  key: K,
  {shouldThrow = true}: {shouldThrow?: boolean} = {}
): NonNullable<NodeJS.ProcessEnv[K]> {
  const value = process.env[key]

  if (!shouldThrow) {
    return value ?? ''
  }

  if (value === undefined) {
    throw new Error(`No value for ${key} env var found.`)
  }

  return value
}
