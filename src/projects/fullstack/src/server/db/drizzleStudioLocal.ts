import {execSync} from 'node:child_process'
import path from 'node:path'

import {wait} from '@qodestack/utils'
import open from 'open'

const drizzleConfigPath = path.resolve(
  import.meta.dirname,
  './drizzle.config.ts'
)

/**
 * Get the `open` command on the stack, just execute it a bit later, giving
 * drizzle studio time to get started.
 */
void wait(1500).then(() => open('https://local.drizzle.studio'))

/**
 * This will actually execute first before `open`, giving time to get started.
 */
execSync(`bunx drizzle-kit studio --config ${drizzleConfigPath}`, {
  stdio: 'inherit',
})
