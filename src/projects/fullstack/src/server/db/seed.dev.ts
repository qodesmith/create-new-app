import {userRoles} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {users} from '@/server/db/schema/authSchema'
import {getEnvVar} from '@/server/utils/getEnvVar'

import {createLogger} from '@qodestack/utils'
import {createEmailVerificationToken} from 'better-auth/api'
import {eq} from 'drizzle-orm'

const log = createLogger({includeTime: false})
const nodeEnv = getEnvVar('NODE_ENV', {shouldThrow: false})

if (nodeEnv === 'development') {
  const {auth} = await import('./auth/auth')

  const authCtx = await auth.$context
  const verifyUserEmail = async (email: string) => {
    const token = await createEmailVerificationToken(
      authCtx.secret,
      email,
      undefined,
      auth.options.emailVerification.expiresIn
    )
    await auth.api.verifyEmail({query: {token}})
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

    await verifyUserEmail(newAdmin.user.email)
  }

  if (!user) {
    log.text('Creating a verified user in the development database...')
    const basicUser = await auth.api.createUser({
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

    await verifyUserEmail(basicUser.user.email)
  }

  if (admin && user) {
    log.text('Already have an admin and user')
  }
} else {
  log.error('Refusing to seed the database with an admin and user.')
  log.text('Run command as follows to see the database:')
  log.warning('  NODE_ENV=development bun db:seed')
  log.text('')
}
