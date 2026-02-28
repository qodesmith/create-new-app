import type {AuthSchemaSelect, Prettify} from '@/shared/types'

import {betterAuth} from 'better-auth'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'

import {getDatabase} from '../getDatabase'
import {authOptions, drizzleAdapterOptions} from '../options'

const _auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(getDatabase(), drizzleAdapterOptions),
})

type _Session = typeof _auth.$Infer.Session

/**
 * Better-auth hardcodes user.id as string in its core Zod schema, regardless
 * of the actual db column type. Our users table uses an integer id, so we
 * override user.id at the source so everything that infers from `auth` gets
 * the correct type.
 */
export const auth = _auth as unknown as Omit<typeof _auth, '$Infer'> & {
  // biome-ignore-start lint/style/useNamingConvention: names come from Better Auth
  $Infer: Omit<typeof _auth.$Infer, 'Session'> & {
    Session: Omit<_Session, 'user'> & {
      // Ensure the user id is a number, not a string.
      user: Omit<_Session['user'], 'id'> & {id: AuthSchemaSelect['users']['id']}
    }
  }
  // biome-ignore-end lint/style/useNamingConvention: names come from Better Auth
}

export type SessionData = Prettify<typeof auth.$Infer.Session>
