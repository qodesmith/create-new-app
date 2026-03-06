# DB Table Reference

## Location

`src/server/db/schema/appSchema.ts` — the ONLY file to edit for new tables.

## Pattern

```ts
import {users} from './authSchema'

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

| JS type    | Column builder                    |
|------------|-----------------------------------|
| string     | `text()`                          |
| number     | `integer()` or `real()`           |
| boolean    | `integer({mode: 'boolean'})`      |
| Date       | `integer({mode: 'timestamp'})`    |
| JSON       | `text({mode: 'json'}).$type<T>()` |
| Buffer     | `blob({mode: 'buffer'})`          |

## Rules

- Always spread `commonFields`
- Foreign keys: `.references(() => table.id, {onDelete: 'cascade'})`
- NEVER touch `authSchema.ts` (managed by Better Auth)
- NEVER touch `src/server/db/drizzle/` (auto-generated migrations)
- After changes: stop dev server, run `bun run db:init`
