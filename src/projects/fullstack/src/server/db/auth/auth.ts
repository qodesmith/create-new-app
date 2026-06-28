import type {Prettify} from '@/shared/types'

import {getDatabase} from '@/server/db/getDatabase'

import {drizzleAdapter} from '@better-auth/drizzle-adapter'
import {betterAuth} from 'better-auth'

import {authOptions, drizzleAdapterOptions} from './authOptions'

export type AuthedSessionData = Prettify<{
  user: typeof auth.$Infer.Session.user
  session: typeof auth.$Infer.Session.session
}>

export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(getDatabase(), drizzleAdapterOptions),
})
