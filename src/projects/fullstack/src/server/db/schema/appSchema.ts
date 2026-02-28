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
  SQLite is synchronous but drizzle exposes async AND sync apis for SQLite. See
  comments in `getDatabase.ts`.
*/

import type {ErrorContext} from '@/shared/types'

import {blob, integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

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
  userId: integer().references(() => users.id, {onDelete: 'cascade'}), // DO NOT add `.notNull()`
})

export const avatarsTable = sqliteTable('avatars', {
  ...commonFields,
  userId: integer()
    .references(() => users.id, {onDelete: 'cascade'})
    .notNull()
    .unique(),
  data: blob({mode: 'buffer'}).notNull(),
  mimeType: text().notNull(),
})
