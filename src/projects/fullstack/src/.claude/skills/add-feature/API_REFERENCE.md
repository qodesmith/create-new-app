# API Endpoint Reference

## Route Groups

| File                | Middleware          | Use when              |
|---------------------|---------------------|-----------------------|
| `authRoutes.ts`     | `authMiddleware`    | User must be logged in |
| `adminRoutes.ts`    | `adminMiddleware`   | Admin-only            |
| `honoServer.ts`     | None (public)       | No auth needed        |

All in `src/server/hono/`.

## Authenticated Endpoint (receives data)

```ts
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

## Authenticated Endpoint (no client data)

```ts
// No arktypeValidator needed for simple GET endpoints
.get('/items', async c => {
  const user = c.get('user')
  const db = getDatabase()
  const items = db.select().from(itemsTable)
    .where(eq(itemsTable.userId, user.id))
    .all()
  return c.json(items)
})
```

## Public Endpoint (on honoServer)

Chain BEFORE `.notFound()` — order matters:

```ts
.get('/api/public-data', async c => {
  const db = getDatabase()
  const data = db.select().from(dataTable).all()
  return c.json(data)
})
```

## Validation

- `arktypeValidator('json', schema)` — JSON body
- `arktypeValidator('form', schema)` — form/file upload
- Only use when endpoint receives client data (POST/PUT/PATCH with body)
- Position: second-to-last arg, right before handler callback
- Imports: `import {arktypeValidator} from '@hono/arktype-validator'` and `import {type} from 'arktype'`

## ErrorContext

See [add-error-context skill](../add-error-context/SKILL.md) for naming convention.

## Fire-and-Forget

For non-critical operations:

```ts
import {noop} from '@qodestack/utils'
void asyncOp().catch(noop)
```
