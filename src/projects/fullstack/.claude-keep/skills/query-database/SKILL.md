---
name: query-database
description: Query the SQLite database using Drizzle ORM sync APIs. Use when user wants to read, insert, update, or delete data, or needs help choosing the right query terminator.
argument-hint: "[query-description]"
---

# Query Database

## Getting the DB Instance

```ts
import {getDatabase} from '@/server/db/getDatabase'
const db = getDatabase()
```

## Sync API Terminators

SQLite is synchronous. Drizzle exposes sync APIs — always prefer these over async:

| Terminator  | Returns                      | Use for                              |
|-------------|------------------------------|--------------------------------------|
| `.all()`    | Array of objects             | SELECT returning multiple rows       |
| `.get()`    | Single object or `undefined` | SELECT expecting one row             |
| `.values()` | Array of raw value arrays    | Raw data without object overhead     |
| `.run()`    | Execution metadata           | INSERT/UPDATE/DELETE without results |

## Common Patterns

Select multiple:
```ts
const items = db.select().from(itemsTable)
  .where(eq(itemsTable.userId, user.id))
  .all()
```

Select one:
```ts
const item = db.select().from(itemsTable)
  .where(eq(itemsTable.id, itemId))
  .get()
```

Insert and return:
```ts
const item = db.insert(itemsTable)
  .values({title, body, userId: user.id})
  .returning()
  .get()
```

Update:
```ts
db.update(itemsTable)
  .set({title: newTitle})
  .where(eq(itemsTable.id, itemId))
  .run()
```

Delete:
```ts
db.delete(itemsTable)
  .where(eq(itemsTable.id, itemId))
  .run()
```

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
