import path from 'node:path'

import open from 'open'

const drizzleConfigPath = path.resolve(import.meta.dir, './drizzle.config.ts')

await open('https://local.drizzle.studio')

Bun.spawn(['bunx', 'drizzle-kit', 'studio', '--config', drizzleConfigPath], {
  stdio: ['inherit', 'inherit', 'inherit'],
})
