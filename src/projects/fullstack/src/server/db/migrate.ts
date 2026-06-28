import path from 'node:path'
import process from 'node:process'

import {isProd} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {log} from '@/server/utils/logger'

import {migrate} from 'drizzle-orm/bun-sqlite/migrator'

/**
 * This function uses the Drizzle JavaScript `migrate` function to run database
 * migrations from Drizzle's meta JSON and sql files. It is ok to call this
 * function multiple times. If there's nothing to migrate, this will be a no-op.
 */
export function migrateDbSchema() {
  if (!isProd) {
    log.warning(
      '`migrateDbSchema` is only meant to run in production - skipping'
    )
    return
  }

  // [bunBinaryPath, currentFilePath, arg1, arg2, ...] => [arg1, arg2, ...]
  const args = process.argv.slice(2) // Skip 'bun' and script path

  // LiteFS check
  const isPrimary = args.includes('--is-primary')

  /**
   * In production deployment, we may have more than one machine deployed and we
   * only want to run the db migration on the primary machine for LiteFS.
   */
  if (!isPrimary) {
    log.text('Skipping database migration on non-primary node in production')
    return
  }

  const db = getDatabase()

  log.text('Applying DB migrations...')

  migrate(db, {
    migrationsFolder: path.resolve(import.meta.dirname, './drizzle'),
  })
}
