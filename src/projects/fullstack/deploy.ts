import {$, which} from 'bun'
import {randomBytes} from 'node:crypto'
import process from 'node:process'

import {createLogger} from '@qodestack/utils'

const log = createLogger({includeTime: false})

if (which('fly') === null) {
  const installHint = (() => {
    switch (process.platform) {
      case 'darwin':
        return '`brew install flyctl`'
      case 'win32':
        return '`pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"`'
      case 'linux':
        return '`curl -L https://fly.io/install.sh | sh`'
      default:
        return 'the instructions at https://fly.io/docs/flyctl/install/'
    }
  })()

  log.error(`The fly CLI was not found. Please install it with ${installHint}`)
  process.exit(1)
}

type FlySecret = {
  name: string
}

const flySecrets: FlySecret[] = await $`fly secrets list --json`.json()
const hasBetterAuthSecret = !!flySecrets.find(
  s => s.name === 'BETTER_AUTH_SECRET'
)

if (!hasBetterAuthSecret) {
  const betterAuthSecret = randomBytes(32).toString('hex')

  log.text('Setting Fly secret for BETTER_AUTH_SECRET...')
  await $`fly secrets set BETTER_AUTH_SECRET=${betterAuthSecret}`
}

await $`fly deploy`
