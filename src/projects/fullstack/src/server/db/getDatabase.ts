import type {Casing} from 'drizzle-orm'
import type {BunSQLiteDatabase} from 'drizzle-orm/bun-sqlite'

import {Database} from 'bun:sqlite'
import fs from 'node:fs'
import path from 'node:path'

import * as appSchema from '@/server/db/schema/appSchema'
import * as authSchema from '@/server/db/schema/authSchema'
import {getEnvVar} from '@/server/utils/getEnvVar'
import {log} from '@/server/utils/logger'

import {errorToObject} from '@qodestack/utils'
import {sql} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/bun-sqlite'

let db: BunSQLiteDatabase<typeof appSchema & typeof authSchema> & {
  $client: Database
}

const casing: Casing = 'camelCase'
const sqlitePath = getEnvVar('SQLITE_PATH')
const schema = {...appSchema, ...authSchema}

/**
 * https://orm.drizzle.team/docs/connect-bun-sqlite
 *
 * SQLite is synchronous but drizzle exposes async AND sync apis for SQLite.
 * These are the SYNC apis available:
 *   1. query.all()
 *     - Returns all rows from the query result as an array of objects.
 *   2. query.get()
 *     - Returns only the first row from the query result as a single object (or
 *       undefined if no results).
 *     - Useful when you expect a single result.
 *   3. query.values()
 *     - Returns all rows as arrays of raw values instead of objects. Each row is
 *       an array where values correspond to column order.
 *     - Use case: When you need raw data without the overhead of creating
 *       objects with named properties
 *     - Returns: Array of arrays, e.g., [[1, 'Alice'], [2, 'Bob']]
 *   4. query.run()
 *     - Executes the query but doesn't return row data. Instead, it returns
 *       metadata about the operation.
 *     - Use case: INSERT, UPDATE, DELETE statements where you don't need the
 *       data back, just confirmation of execution.
 *     - Returns: Execution metadata (changes made, last insert ID, etc.)
 */
export function getDatabase() {
  if (!db) {
    db = drizzle({client: new Database(sqlitePath), schema, casing})

    /**
     * https://www.sqlite.org/pragma.html#pragma_foreign_keys
     *
     * SQLite defaults to having foreign keys off.
     *
     * Ensure foreign key support is on. Without this, updating a primary key
     * will not cascade to any tables referencing it as a foreign key.
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
     * performance, especially in situations with many concurrent readers and a
     * single writer. It's broadly recommended to enable WAL mode for most
     * typical applications.
     */
    db.run(sql`PRAGMA journal_mode = WAL;`)
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
   *
   * VACUUM INTO doesn't accept bound parameters — sql.raw inlines the value
   * directly into the SQL string. Quotes are needed because it's a file path
   * (SQL string literal), not a numeric value.
   */
  const backupPath = `${sqlitePath}.${Date.now()}.backup`
  db.run(sql`VACUUM INTO ${sql.raw(`'${backupPath}'`)}`)

  return {
    bunFile: Bun.file(backupPath),
    fileName: path.parse(backupPath).base,
  }
}
