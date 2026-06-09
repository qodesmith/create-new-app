/** biome-ignore-all lint/style/useNamingConvention: env vars are ok */

import process from 'node:process'

/**
 * Test preload (registered via `[test] preload` in bunfig.toml).
 *
 * Several modules in the server import chain read required env vars at MODULE
 * LOAD time (e.g. `@/server/constants` reads PORT/DOMAIN/NODE_ENV, and
 * `@/server/db/getDatabase` reads SQLITE_PATH). A preload runs before any test
 * file or its imports are evaluated, so it's the only reliable place to set
 * these without fighting ESM import hoisting. This file only sets defaults — it
 * never overrides values already present in the environment.
 */

const defaults: Record<string, string> = {
  PORT: '3000',
  DOMAIN: 'example.com',
  NODE_ENV: 'test',
  SQLITE_PATH: ':memory:',
}

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value
}
