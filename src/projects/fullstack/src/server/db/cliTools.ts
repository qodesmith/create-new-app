import process from 'node:process'
import {parseArgs} from 'node:util'

import {userRoles} from '@/server/constants'
import {auth} from '@/server/db/auth/auth'
import {getDatabase} from '@/server/db/getDatabase'
import {users} from '@/server/db/schema/authSchema'
import {getEnvVar} from '@/server/utils/getEnvVar'
import {minPasswordLength} from '@/shared/constants'

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
    role: {type: 'string'},
  },
  strict: true,
  allowPositionals: true,
})

const [_bunBinaryPath, _currentFilePath, ...positionalArgs] = positionals
const [task] = positionalArgs as (keyof typeof tasks)[]

const tasks = {
  createAdminUser: async () => {
    const email = getEnvVar('ADMIN_EMAIL', {shouldThrow: false})
    const password = getEnvVar('ADMIN_PASSWORD', {shouldThrow: false})
    const {name, lastName} = values

    /**
     * Creating an admin user expects the admin's email and password to be set
     * as env variables.
     */
    if (!(email && password)) {
      log.error(
        'To create and admin user, you must set the following env variables:'
      )
      log.error('  * ADMIN_EMAIL')
      log.error('  * ADMIN_PASSWORD')

      process.exit()
    }

    if (!(name && lastName)) {
      log.warning('Using default name for admin user:', name, lastName)
    }

    await tasks.createUser({
      email,
      password,
      name: name ?? 'Admin',
      lastName: lastName ?? 'Supreme',
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
    const userRoleValues = Object.values(userRoles)

    if (!userRoleValues.includes(role)) {
      log.error(`${role} is not a value user role. Possible values are:`)

      for (const userRole in userRoles) {
        log.error(`  * ${userRole}`)
      }

      process.exit()
    }

    if (password.length < minPasswordLength) {
      log.error(`The password must be at least ${minPasswordLength} characters`)
      process.exit()
    }

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
