import type {BunSQLiteDatabase} from 'drizzle-orm/bun-sqlite'

import {Database} from 'bun:sqlite'
import fs from 'node:fs'
import path from 'node:path'

import {isProd} from '@/server/constants'
import {log} from '@/server/utils/logger'

import {errorToObject} from '@qodestack/utils'
import {sql} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/bun-sqlite'

import {getEnvVar} from '../utils/getEnvVar'
import {casing} from './options'
import * as appSchema from './schema/appSchema'
import * as authSchema from './schema/authSchema'

let db: BunSQLiteDatabase<typeof appSchema & typeof authSchema> & {
  $client: Database
}

const sqlitePath = getEnvVar('SQLITE_PATH')
const schema = {...appSchema, ...authSchema}

export function getDatabase() {
  if (!db) {
    db = drizzle({client: new Database(sqlitePath), schema, casing})

    if (isProd) {
      /**
       * https://www.sqlite.org/pragma.html#pragma_foreign_keys
       *
       * SQLite defaults to having foreign keys off.
       *
       * Ensure foreign key support is on. Without this, updating a primary key
       * will not cascade to any tables referencing is as a foreign key.
       */
      db.run(sql`PRAGMA foreign_keys = ON;`)

      /**
       * This sets the busy timeout which helps prevent "database is locked"
       * errors by allowing SQLite to wait longer for locked resources to become
       * available. It's a good practice to set this pragma, especially in
       * multi-threaded applications or when you have increased simultaneous
       * read/write operations.
       *
       * This setting is per-connection, so it should be set each time a new
       * database connection is opened.
       *
       * Why the sql.raw inside sql? https://orm.drizzle.team/docs/sql#sqlraw
       */
      const busyTimeout = 10_000
      db.run(sql`PRAGMA busy_timeout = ${sql.raw(busyTimeout.toString())};`)

      /**
       * https://bun.sh/docs/api/sqlite#wal-mode
       *
       * SQLite supports write-ahead log mode (WAL) which dramatically improves
       * performance, especially in situations with many concurrent readers and
       * a single writer. It's broadly recommended to enable WAL mode for most
       * typical applications.
       */
      db.run(sql`PRAGMA journal_mode = WAL;`)
    }
  }

  return db
}

export function exportDatabase() {
  const db = getDatabase()
  const {dir, name, ext} = path.parse(sqlitePath)
  const dbName = `${name}${ext}`

  // Delete old backups
  fs.readdirSync(dir).forEach(fileName => {
    if (fileName.includes(dbName) && fileName.endsWith('.backup')) {
      const backupName = path.join(dir, fileName)

      try {
        fs.unlinkSync(backupName)
      } catch (e) {
        log.error(
          `Error deleting database backup file ${backupName}:`,
          errorToObject(e, {prettyStack: true})
        )
      }
    }
  })

  /**
   * VACUUM INTO creates a complete, consistent backup of the database without
   * disrupting production operations. Unlike WAL checkpointing, VACUUM INTO:
   *   - Doesn't block reads or writes to the main database
   *   - Creates a complete backup including all WAL data
   *   - Generates a clean database file without WAL dependencies
   *   - Runs atomically (backup file is complete or doesn't exist)
   *
   * This approach is ideal for backups as it ensures data integrity while
   * allowing normal database operations to continue uninterrupted.
   */
  const backupPath = `${sqlitePath}.${Date.now()}.backup`
  db.run(sql`VACUUM INTO ${backupPath}`)

  return {
    bunFile: Bun.file(backupPath),
    fileName: path.parse(backupPath).base,
  }
}
