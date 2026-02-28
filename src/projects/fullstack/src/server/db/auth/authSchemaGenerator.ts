/**
 * For some reason Drizzle isn't playin nice with 'bun:sqlite' and will only
 * recognize 'better-sqlite3'. Whatever, this is only for dev anyways.
 */
import {Database} from 'bun:sqlite'

import {authOptions, drizzleAdapterOptions} from '@/server/db/auth/auth'

import {betterAuth} from 'better-auth'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'

/**
 * This `betterAuth` instance is solely used for generating the auth schema.
 * This is not intended to be consumed for use by the server. The Better Auth
 * schema will need to be generated any time updates are made to `authOptions`,
 * such as a plugin being added.
 *
 * Why have a separate auth instance just for schema generation? Why not use the
 * actual auth instance? Two reasons:
 * 1. The actual SQLite database isn't needed for auth schema generation.
 * 2. `getDatabase.ts` imports the entire schema - we don't need that either.
 *    And in the case of creating Drizzle SQLite tables that reference an auth
 *    table you haven't generated yet, this will result in import errors.
 */
export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(new Database(':memory:'), drizzleAdapterOptions),
})
