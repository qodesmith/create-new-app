---
name: add-feature
description: Scaffold a full-stack vertical slice — DB table, API endpoint, route, components, types, and tests. Use when user wants to add a new feature, build a new page with backend, or create a full-stack slice.
argument-hint: "[feature-description]"
---

# Add Feature

Full-stack feature scaffolding across DB, API, route, components, and types.

## Interview

Ask the developer before scaffolding:

- Feature name and brief description?
- Needs authentication? Admin-only?
- What data/fields? (DB table needed?)
- What UI? List, form, detail view, dialog?
- Search params on the route?
- Code-split (lazy route)? Default: yes for auth routes.

## Scaffold Order

Each step validates before next:

1. DB table if needed — see [add-db-table](../add-db-table/SKILL.md)
2. API endpoint in correct route group — see [add-api-endpoint](../add-api-endpoint/SKILL.md)
3. ErrorContext entries — see [add-error-context](../add-error-context/SKILL.md)
4. Route file(s) — see [add-route](../add-route/SKILL.md)
5. Components — see [add-component](../add-component/SKILL.md)
6. Wire frontend to backend via Hono RPC atoms (`apiClientAtom` / `apiAuthClientAtom`)

## Finalize

- If schema changed: remind to stop dev server, run `bun run db:init`
- Verify Hono RPC types flow (server type export → client atom consumption)

## Error Logging

Client:
```ts
import {useLogClientError} from '@/client/hooks/useLogClientError'

const logClientError = useLogClientError()
logClientError({error, context: 'client:featureNameException'})
```

Server:
```ts
import {bestEffort, errorToObject} from '@qodestack/utils'

bestEffort(() => {
  db.insert(errorsTable)
    .values({error: errorToObject(error), context: 'server:featureNameException'})
    .run()
})
```

## RPC Wiring

```ts
// Server exports type automatically via Hono chaining
// Client consumes via Jotai atom:
const apiAuthClient = useAtomValue(apiAuthClientAtom)
const res = await apiAuthClient.myEndpoint.$post({json: data})
const result = await res.json()
```

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
