import {betterAuth} from 'better-auth'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'

import {getDatabase} from '../getDatabase'
import {authOptions, drizzleAdapterOptions} from '../options'

export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(getDatabase(), drizzleAdapterOptions),
})

export type SessionData = typeof auth.$Infer.Session
