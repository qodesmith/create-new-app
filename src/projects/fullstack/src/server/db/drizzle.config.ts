import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {isProdEnv} from '@/server/constants'
import {getEnvVar} from '@/server/utils/getEnvVar'

import {defineConfig} from 'drizzle-kit'

/**
 * THIS IS INTENTIONAL!!!
 *
 * DO NOT use `import.meta.filename`. The underlying Drizzle code that consumes
 * this config is cjs and doesn't work with `import.meta.filename`. This way
 * allows us to avoid using `__dirname` which is only available in cjs.
 */
const currentFileDir = path.dirname(fileURLToPath(import.meta.url))
const sqlitePath = getEnvVar('SQLITE_PATH') // '/path/to/db.sqlite'

// biome-ignore lint/style/noDefaultExport: drizzle expects a default export
export default defineConfig({
  out: path.resolve(currentFileDir, './drizzle'),
  schema: path.resolve(currentFileDir, './schema'),
  dialect: 'sqlite',
  dbCredentials: {
    url: isProdEnv ? sqlitePath : path.resolve(process.cwd(), sqlitePath),
  },
})
