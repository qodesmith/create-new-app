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
3. ErrorContext entries, only for failures worth persisting — see [add-error-context](../add-error-context/SKILL.md)
4. Route file(s) — see [add-route](../add-route/SKILL.md)
5. Components — see [add-component](../add-component/SKILL.md)
6. Wire frontend to backend via Hono RPC atoms (`apiClientAtom` / `apiAuthClientAtom`)

## Finalize

- If schema changed: remind to stop dev server, run `bun run db:init`
- Verify Hono RPC types flow (server type export → client atom consumption)

## Error Capture

Client:
```ts
import {useCaptureError} from '@/client/hooks/useCaptureError'

const captureError = useCaptureError()
captureError({error, context: 'client:featureName:exception'})
```

Server:
```ts
import {captureError} from '@/server/errorCapture/captureError'

captureError({error, context: 'server:featureName:exception'})
```

## RPC Wiring

Always wrap the call with `parseResponse` from `hono/client` inside `useMutation` or `useQuery`. `parseResponse` returns the typed body on 2xx and throws `DetailedError` on non-2xx.

In `onError`, branch on `error instanceof DetailedError`. Detailed errors mean the server replied, so treat expected 4xx responses as user-facing UX and do not capture them. Capture only non-DetailedError failures from the client, because those are browser-side exceptions the server could not see.

```ts
import {useMutation} from '@tanstack/react-query'
import {DetailedError, parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {useCaptureError} from '@/client/hooks/useCaptureError'
import {apiAuthClientAtom} from '@/client/state/globalState'

const apiAuthClient = useAtomValue(apiAuthClientAtom)
const captureError = useCaptureError()

const myMutation = useMutation({
  mutationFn: async (input: MyInput) => {
    return parseResponse(apiAuthClient.myEndpoint.$post({json: input}))
  },
  onSuccess: data => { /* typed success body */ },
  onError: error => {
    const isRejection = error instanceof DetailedError

    toast.error('Friendly message')
    if (!isRejection) {
      captureError({error, context: 'client:myFeature:exception'})
    }
  },
})
```

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
