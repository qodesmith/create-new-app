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

1. DB table in `appSchema.ts` if needed — see [DB_REFERENCE.md](DB_REFERENCE.md)
2. API endpoint in correct route group — see [API_REFERENCE.md](API_REFERENCE.md)
3. ErrorContext entries — see [add-error-context skill](../add-error-context/SKILL.md)
4. Route file(s) in `src/client/routes/` — see [ROUTE_REFERENCE.md](ROUTE_REFERENCE.md)
5. Colocated components (`-ComponentName.tsx`) or shared components as needed
6. Install missing Shadcn components: `bunx shadcn@latest add <name>`
7. Wire frontend to backend via Hono RPC atoms (`apiClientAtom` / `apiAuthClientAtom`)

## Finalize

- Run `biome check --write <files>` on all created/edited files
- If schema changed: remind to stop dev server, run `bun run db:init`
- Verify Hono RPC types flow (server type export → client atom consumption)

## NEVER

- Use npm/node — always Bun
- Use raw `fetch` — always Hono RPC via `apiClientAtom` or `apiAuthClientAtom`
- Use raw Radix — always Shadcn components
- Touch `routeTree.gen.ts`, `src/server/db/drizzle/`, or `authSchema.ts`
- Modify build/dev scripts, Dockerfiles, fly.toml, .env, tsconfig, biome config without permission

## Error Logging

```ts
import {logClientError} from '@/client/lib/utils'
logClientError({error, context: 'client:featureNameException', apiClient})
```

## RPC Wiring

```ts
// Server exports type automatically via Hono chaining
// Client consumes via Jotai atom:
const apiAuthClient = useAtomValue(apiAuthClientAtom)
const res = await apiAuthClient.myEndpoint.$post({json: data})
const result = await res.json()
```
