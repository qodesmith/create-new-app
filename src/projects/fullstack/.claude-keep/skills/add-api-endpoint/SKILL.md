---
name: add-api-endpoint
description: Add a Hono API endpoint with proper RPC typing and optional ArkType validation. Use when user wants to create an API route, endpoint, backend handler, or server action.
argument-hint: "[endpoint-description]"
---

# Add API Endpoint

## Interview

- What does the endpoint do?
- Auth required? Admin-only? Public?
- HTTP method?
- Receives client data (body/form)?
- What does it return?

## Route Group Selection

| Auth level    | File             | Variable      | Middleware        |
|---------------|------------------|---------------|-------------------|
| Authenticated | `authRoutes.ts`  | `authRoutes`  | `authMiddleware`  |
| Admin-only    | `adminRoutes.ts` | `adminRoutes` | `adminMiddleware` |
| Public        | `honoServer.ts`  | `honoServer`  | None              |

All in `src/server/hono/`.

## Endpoint Receiving Data

```ts
import {arktypeValidator} from '@hono/arktype-validator'
import {type} from 'arktype'

// Chain onto authRoutes in authRoutes.ts
.post(
  '/items',
  arktypeValidator('json', type({title: 'string', body: 'string'})),
  async c => {
    const user = c.get('user')
    const db = getDatabase()
    const {title, body} = c.req.valid('json')

    const item = db.insert(itemsTable)
      .values({title, body, userId: user.id})
      .returning()
      .get()

    return c.json(item)
  }
)
```

## Endpoint Without Client Data

No `arktypeValidator` needed:
```ts
.get('/items', async c => {
  const user = c.get('user')
  const db = getDatabase()
  const items = db.select().from(itemsTable)
    .where(eq(itemsTable.userId, user.id))
    .all()
  return c.json(items)
})
```

## Public Endpoints (honoServer)

Chain BEFORE `.notFound()` — order matters.

## Validation Rules

- `arktypeValidator('json', schema)` — JSON body
- `arktypeValidator('form', schema)` — form/file upload
- Only when endpoint receives client data (POST/PUT/PATCH with body)
- Position: second-to-last arg, right before handler

## Fire-and-Forget

For non-critical async operations, use the `bestEffort` server utility, guaranteed to not throw:

```ts
import {bestEffort} from '@qodestack/utils'
bestEffort(() => asyncOp())
```

## Transactions

Use `db.transaction()` when an endpoint performs multiple DB writes that must succeed or fail together. If any operation inside the callback throws, all changes roll back automatically.

**When to use:** Multiple related inserts/updates/deletes where partial completion would leave data inconsistent (e.g., delete records + log the action).

**When NOT to use:** Single DB operations (already atomic), multiple independent operations on unrelated tables where partial failure is acceptable, or non-DB side effects like file I/O that can't participate in a SQLite transaction.

```ts
.delete('/items', async c => {
  const user = c.get('user')
  const db = getDatabase()

  const result = db.transaction(tx => {
    const deleted = tx.delete(itemsTable)
      .where(eq(itemsTable.userId, user.id))
      .returning()
      .all()

    tx.insert(adminAuditLogsTable)
      .values({userId: user.id, metadata: {deletedCount: deleted.length}})
      .run()

    return deleted
  })

  return c.json({deleted: result.length})
})
```

## Querying the Database

See [query-database](../query-database/SKILL.md) for sync API terminators and common patterns.

## ErrorContext

See [add-error-context skill](../add-error-context/SKILL.md) for naming convention.

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
