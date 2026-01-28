/** biome-ignore-all lint/suspicious/noConsole: it's ok */

import {userRoles} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {users} from '@/server/db/schema/authSchema'
import {getEnvVar} from '@/server/utils/getEnvVar'

import {createLogger} from '@qodestack/utils'
import {eq} from 'drizzle-orm'

const log = createLogger({includeTime: false})
const nodeEnv = getEnvVar('NODE_ENV', {shouldThrow: false})

if (nodeEnv) {
  const {auth} = await import('./auth/auth')

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
    const admin = db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'))
      .get()
    const user = db
      .select()
      .from(users)
      .where(eq(users.email, 'user@example.com'))
      .get()

    if (!admin) {
      log.text('Creating a verified admin in the development database...')

      const newAdmin = await auth.api.createUser({
        body: {
          name: 'Admin',
          email: 'admin@example.com',
          password: 'password',
          role: userRoles.admin,
          data: {
            lastName: 'Supreme',
          },
        },
      })

      await auth.api.sendVerificationEmail({
        body: {email: newAdmin.user.email},
      })

      await auth.api.verifyEmail({query: {token}})
      token = ''
    }

    if (!user) {
      log.text('Creating a verified user in the development database...')
      const newAdmin = await auth.api.createUser({
        body: {
          name: 'Basic',
          email: 'user@example.com',
          password: 'password',
          role: 'user',
          data: {
            lastName: 'User',
          },
        },
      })

      await auth.api.sendVerificationEmail({
        body: {email: newAdmin.user.email},
      })

      await auth.api.verifyEmail({query: {token}})
      token = ''
    }

    if (admin && user) {
      log.text('Already have an admin and user')
    }
  } finally {
    // @ts-expect-error - Undo the previous overwrite
    auth.options.emailVerification.sendVerificationEmail = origFxn
  }
} else {
  log.error('Refusing to seed the database with an admin and user.')
  log.text('Run command as follows to see the databse:')
  log.warning('  NODE_ENV=development bun db:seed')
  log.text('')
}
