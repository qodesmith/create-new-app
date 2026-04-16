---
name: add-db-table
description: Add a Drizzle ORM SQLite table to appSchema.ts with commonFields, relations, and cascading foreign keys. Use when user wants to create a database table, model, entity, or schema.
argument-hint: "[table-name]"
---

# Add DB Table

## Interview

- Table name?
- Fields and types?
- Foreign keys (which tables)?
- Relations needed?

## Location

`src/server/db/schema/appSchema.ts` — the ONLY file for new tables.

## Template

```ts
export const postsTable = sqliteTable('posts', {
  ...commonFields,
  title: text().notNull(),
  body: text().notNull(),
  published: integer({mode: 'boolean'}).default(false).notNull(),
  userId: text()
    .references(() => users.id, {onDelete: 'cascade'})
    .notNull(),
})
```

`commonFields` is already defined in the file — provides `id`, `createdAt`, `updatedAt`.

## Relations

```ts
import {relations} from 'drizzle-orm'

export const postsRelations = relations(postsTable, ({one, many}) => ({
  author: one(users, {
    fields: [postsTable.userId],
    references: [users.id],
  }),
}))
```

## SQLite Column Types

| JS type | Column builder                    |
|---------|-----------------------------------|
| string  | `text()`                          |
| number  | `integer()` or `real()`           |
| boolean | `integer({mode: 'boolean'})`      |
| Date    | `integer({mode: 'timestamp'})`    |
| JSON    | `text({mode: 'json'}).$type<T>()` |
| Buffer  | `blob({mode: 'buffer'})`          |

## After Changes

Stop the dev server, then run `bun run db:init`. This will:
1. Generate the Better Auth schema
2. Generate SQL migration files
3. Apply the migration files
4. Ensure an admin and regular user are created in the database

## Querying the Database

See [query-database](../query-database/SKILL.md) for sync API terminators and common patterns.

## Rules

- Always spread `commonFields`
- Foreign keys: `.references(() => table.id, {onDelete: 'cascade'})`
- Foreign keys to Better Auth tables (`authSchema.ts`) use `text()` (Better Auth IDs are strings). Foreign keys to app tables use `integer()` to match `commonFields.id`.

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
