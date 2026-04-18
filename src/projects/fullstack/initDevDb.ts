import {$} from 'bun'
import {existsSync, readdirSync, rmdirSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {createLogger} from '@qodestack/utils'

const log = createLogger({includeTime: false})

if (process.env.NODE_ENV !== 'development') {
  log.error('DB initialization is only for dev')
  process.exit()
}

function logLine() {
  log.text()
  log.text('-'.repeat(50))
  log.text()
}

/////////////////////////////////////
// GENERATE THE BETTER-AUTH SCHEMA //
/////////////////////////////////////

/**
 * https://www.better-auth.com/docs/concepts/cli#generate
 *
 * The generate command creates the schema required by Better Auth.
 *
 * It is safe to run this multiple times. If there are no schema changes, the
 * generated output will be identical.
 */
log.warning('[BETTER AUTH] Generating schema...')
await $`bun --bun run better-auth generate --config src/server/db/auth/authSchemaGenerator.ts --output src/server/db/schema/authSchema.ts -y`
logLine()

// Format the file created by the `generate` command above.
log.warning('[BIOME] Formatting Better Auth schema file...')
await $`bun --bun run biome check --write src/server/db/schema/authSchema.ts`
logLine()

/////////////////////////////////////
// GENERATE & APPLY SQL MIGRATIONS //
/////////////////////////////////////

/**
 * drizzle-kit only initializes `meta/_journal.json` when the `meta` directory
 * is missing. If `meta/` exists but is empty (e.g. a stale folder from a prior
 * aborted run), drizzle-kit skips init and then crashes reading the missing
 * journal file. Remove an empty `meta/` so drizzle-kit can initialize it.
 */
const metaDir = path.resolve('src/server/db/drizzle/meta')
if (existsSync(metaDir) && readdirSync(metaDir).length === 0) {
  rmdirSync(metaDir)
}

/**
 * https://orm.drizzle.team/docs/drizzle-kit-generate
 *
 * drizzle-kit generate lets you generate SQL migrations based on your Drizzle
 * schema upon declaration or on subsequent schema changes.
 *
 * It is safe to run this multiple times. If there are no schema changes,
 * drizzle will not create any migrations.
 */
log.warning('[DRIZZLE KIT] Generating SQL migrations...')
await $`bun --bun run drizzle-kit generate --dialect sqlite --schema src/server/db/schema --out src/server/db/drizzle`
logLine()

/**
 * https://orm.drizzle.team/docs/migrations (option 3)
 *
 * 1. read migration.sql files in migrations folder
 * 2. fetch migration history from database
 * 3. pick previously unapplied migrations
 * 4. apply new migration to the database
 *
 * It is safe to run this multiple times. If there are no unapplied migrations,
 * drizzle will not apply any migrations.
 */
log.warning('[DRIZZLE KIT] Applying SQL migrations to database...')
await $`bun --bun drizzle-kit migrate --config src/server/db/drizzle.config.ts`
logLine()

///////////////////////
// SEED THE DATABASE //
///////////////////////

// Create an admin and regular user.
log.warning('[BUN] Seeding the database...')
await $`bun --bun run src/server/db/seed.dev.ts`
