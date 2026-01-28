import type {userRoles} from '@/server/constants'

import process from 'node:process'
import {parseArgs} from 'node:util'

import {auth} from '@/server/db/auth/auth'
import {getDatabase} from '@/server/db/getDatabase'
import {users} from '@/server/db/schema/authSchema'
import {getEnvVar} from '@/server/utils/getEnvVar'

import {createLogger} from '@qodestack/utils'
import {eq} from 'drizzle-orm'

const log = createLogger({includeTime: false})
const {values, positionals} = parseArgs({
  args: Bun.argv,
  options: {
    help: {type: 'boolean'},
    email: {type: 'string'},
    password: {type: 'string'},
    name: {type: 'string'},
    lastName: {type: 'string'},
  },
  strict: true,
  allowPositionals: true,
})

const [_bunBinaryPath, _currentFilePath, ...positionalArgs] = positionals
const [task] = positionalArgs as (keyof typeof tasks)[]

const tasks = {
  createAdminUser: async () => {
    await tasks.createUser({
      email: getEnvVar('ADMIN_EMAIL'),
      password: getEnvVar('ADMIN_PASSWORD'),
      name: 'Admin',
      lastName: 'Supreme',
      role: 'admin',
    })
  },
  createUser: async ({
    email,
    password,
    name,
    lastName,
    role = 'user',
  }: {
    email: string
    password: string
    name: string
    lastName: string
    role?: keyof typeof userRoles
  }) => {
    let token = ''
    const origFxn = auth.options.emailVerification.sendVerificationEmail

    try {
      // @ts-expect-error - There's no way to get the token via the api
      auth.options.emailVerification.sendVerificationEmail = (data: {
        token: string
      }) => {
        token = data.token
      }

      const db = getDatabase()
      const user = db.select().from(users).where(eq(users.email, email)).get()

      if (user) {
        log.warning('Account already exists. Not creating anything.')
      } else {
        log.warning(`Creating a verified ${role} in the production database...`)

        const newUser = await auth.api.createUser({
          body: {name, email, password, role, data: {lastName}},
        })

        await auth.api.sendVerificationEmail({
          body: {email: newUser.user.email},
        })

        await auth.api.verifyEmail({query: {token}})
        token = ''

        log.success('Account created!')
      }
    } finally {
      // @ts-expect-error - Undo the previous overwrite
      auth.options.emailVerification.sendVerificationEmail = origFxn
    }
  },
}

if (values.help || !positionalArgs.length) {
  log.text('Available arguments:')

  for (const taskName in tasks) {
    log.text(`  * ${taskName}`)
  }

  process.exit()
}

if (positionalArgs.length > 1) {
  log.error('Only 1 argument can be made at a time')
  process.exit()
}

if (task === 'createAdminUser') {
  await tasks.createAdminUser()
  process.exit()
}

if (task === 'createUser') {
  const {email, password, name, lastName} = values

  if (!(email && password && name && lastName)) {
    log.error('You must provide --email, --password, --name, and --lastName')
    process.exit()
  }

  await tasks.createUser({email, password, name, lastName})
  process.exit()
}

log.error(`"${task}" is not a valid argument`)
