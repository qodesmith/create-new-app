import process from 'node:process'
import {parseArgs} from 'node:util'

import {userRoles} from '@/server/constants'
import {auth} from '@/server/db/auth/auth'
import {getDatabase} from '@/server/db/getDatabase'
import {users} from '@/server/db/schema/authSchema'
import {minPasswordLength} from '@/shared/constants'

import {createLogger} from '@qodestack/utils'
import {createEmailVerificationToken} from 'better-auth/api'
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
  createAdminUser: async ({
    email,
    password,
    name,
    lastName,
  }: {
    email: string
    password: string
    name: string
    lastName: string
  }) => {
    return tasks.createUser({email, password, name, lastName, role: 'admin'})
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

    const db = getDatabase()
    const user = db.select().from(users).where(eq(users.email, email)).get()

    if (user) {
      log.warning('Account already exists. Not creating anything.')
    } else {
      log.warning(`Creating a verified ${role} in the production database...`)

      const newUser = await auth.api.createUser({
        body: {name, email, password, role, data: {lastName}},
      })

      const authCtx = await auth.$context
      const token = await createEmailVerificationToken(
        authCtx.secret,
        newUser.user.email,
        undefined,
        auth.options.emailVerification.expiresIn
      )
      await auth.api.verifyEmail({query: {token}})

      log.success('Account created!')
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

if (task === 'createAdminUser' || task === 'createUser') {
  const {email, password, name, lastName} = values
  if (!(email && password && name && lastName)) {
    log.error('You must provide --email, --password, --name, and --lastName')
    process.exit()
  }

  await tasks[task]({email, password, name, lastName})
  process.exit()
}

if (!(task in tasks)) {
  log.error(`"${task}" is not a valid argument. Valid arguments include:`)

  for (const validTask in tasks) {
    log.error(`  * ${validTask}`)
  }

  process.exit()
}
