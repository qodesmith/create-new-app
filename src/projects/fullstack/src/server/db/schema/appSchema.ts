/*
  https://orm.drizzle.team/docs/column-types/sqlite
  https://bun.sh/docs/api/sqlite#datatypes

  | JavaScript type | SQLite type        |
  | --------------- | ------------------ |
  | string          | TEXT               |
  | number          | INTEGER or DECIMAL |
  | boolean         | INTEGER (1 or 0)   |
  | Uint8Array      | BLOB               |
  | Buffer          | BLOB               |
  | bigint          | INTEGER            |
  | null            | NULL               |

  When making changes to the database in dev, run `bun run db:init` from the
  root of the project, which will:
    1. Generate the Better-Auth schema
    2. Generate SQL migration files
    3. Apply the SQL migration files
    4. Ensure an admin and regular user are created in the database

  https://orm.drizzle.team/drizzle-studio/overview
  Start drizzle studio, a visual way to see your database:
    - Run `bun run db:view`
    - Visit https://local.drizzle.studio
    - If using Brave, turn shields off to see the site

  https://orm.drizzle.team/docs/connect-bun-sqlite
  SQLite is synchronous but drizzle exposes async AND sync apis for SQLite.
  These are the SYNC apis available:
    1. query.all()
      - Returns all rows from the query result as an array of objects.
    2. query.get()
      - Returns only the first row from the query result as a single object (or
        undefined if no results).
      - Useful when you expect a single result.
    3. query.values()
      - Returns all rows as arrays of raw values instead of objects. Each row is
        an array where values correspond to column order.
      - Use case: When you need raw data without the overhead of creating
        objects with named properties
      - Returns: Array of arrays, e.g., [[1, 'Alice'], [2, 'Bob']]
    4. query.run()
      - Executes the query but doesn't return row data. Instead, it returns
        metadata about the operation.
      - Use case: INSERT, UPDATE, DELETE statements where you don't need the
        data back, just confirmation of execution.
      - Returns: Execution metadata (changes made, last insert ID, etc.)
*/

import type {ErrorContext} from '@/shared/types'

import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

import {users} from './authSchema'

const commonFields = {
  id: integer().primaryKey({autoIncrement: true}),
  updatedAt: integer({mode: 'timestamp'})
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
  createdAt: integer({mode: 'timestamp'})
    .$defaultFn(() => new Date())
    .notNull(),
} as const

export const errorsTable = sqliteTable('errors', {
  ...commonFields,
  error: text({mode: 'json'}).$type<Record<string, unknown>>().notNull(),
  location: text().$type<'client' | 'bun' | 'hono'>().notNull(),
  context: text().$type<ErrorContext>().notNull(),
  metadata: text({mode: 'json'}).$type<Record<string, unknown>>(),
  // The potentially logged-in user.
  userId: text().references(() => users.id, {onDelete: 'cascade'}), // DO NOT add `.notNull()`
})
