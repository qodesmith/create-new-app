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

Client — only log genuine catch-clause exceptions, not non-2xx server responses:
```ts
import {useLogClientError} from '@/client/hooks/useLogClientError'

const logClientError = useLogClientError()
logClientError({error, context: 'client:featureName:exception'})
```

Server — log inline at the rejection source when the operation has no user-error failure mode:
```ts
import {bestEffort, errorToObject} from '@qodestack/utils'

bestEffort(() => {
  db.insert(errorsTable)
    .values({error: errorToObject(error), context: 'hono:featureName:rejection'})
    .run()
})
```

## RPC Wiring

Wrap the call with `parseResponse` from `hono/client` inside `useMutation` or `useQuery`. `parseResponse` returns the typed body on 2xx and throws `DetailedError` on non-2xx.

In `onError`, use a hardcoded toast message keyed off the action context — never surface `error.message` to the user. Only log when the error is **not** a `DetailedError` (i.e. it's a real client-side exception, not a non-2xx response — those are already logged server-side if they warrant it).

```ts
import {useMutation} from '@tanstack/react-query'
import {DetailedError, parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {apiAuthClientAtom} from '@/client/state/globalState'

const apiAuthClient = useAtomValue(apiAuthClientAtom)

const myMutation = useMutation({
  mutationFn: async (input: MyInput) => {
    return parseResponse(apiAuthClient.myEndpoint.$post({json: input}))
  },
  onSuccess: data => { /* typed success body */ },
  onError: error => {
    toast.error('Failed to do the thing')

    if (!(error instanceof DetailedError)) {
      logClientError({error, context: 'client:myFeature:exception'})
    }
  },
})
```

If the success path navigates away from the page, scope the error toast so it doesn't linger on the destination — see [Scoped Error Toasts](../add-route/SKILL.md#scoped-error-toasts) in add-route.

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
