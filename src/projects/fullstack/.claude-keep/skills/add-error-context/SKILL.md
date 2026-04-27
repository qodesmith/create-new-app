---
name: add-error-context
description: Add a new entry to the ErrorContext union type in src/shared/types.d.ts. Use when adding error tracking for API calls, service calls, or catch-all handlers.
argument-hint: "[error-context-description]"
---

# Add ErrorContext Entry

Add a new entry to the `ErrorContext` union type in `src/shared/types.d.ts`.

## Naming Convention

Format: `<service>:<operation><Suffix>`

### 1. Client API calls — Rejection + Exception pair

```ts
| 'client:<operation>Rejection'
| 'client:<operation>Exception'
```

Hono RPC calls are wrapped with `parseResponse` from `hono/client` inside `useMutation` / `useQuery`. `parseResponse` returns the typed body on 2xx and throws `DetailedError` on non-2xx, so all failures land in `onError`. In the `onError` handler, branch on `error instanceof DetailedError` to pick the context tag:

- **Rejection** — `error instanceof DetailedError` is `true`. Server replied with a non-2xx status; `parseResponse` threw `DetailedError`. Tag: `client:<operation>Rejection`.
- **Exception** — `error instanceof DetailedError` is `false`. Anything else thrown inside `mutationFn` / `queryFn` (network/CORS failure, JSON parse error, code error). Tag: `client:<operation>Exception`.

### 2. Server-side async calls to external services — Rejection + Exception pair

```ts
| '<service>:<operation>Rejection'
| '<service>:<operation>Exception'
```

- Same Rejection/Exception distinction as client calls
- `<service>` is the external service name (e.g. `resend`, `stripe`, etc.)

### 3. Standalone error scenarios — Exception only

```ts
| '<area>:<name>Exception'
```

- For catch-all handlers or one-off error scenarios with no corresponding rejection
- `<area>` is the service or subsystem (e.g. `hono`, `betterAuth`, etc.)

## Rules

- All names are camelCase after the colon
- Place new entries in the correct section (Server or Client) with a comment if starting a new group
- Check existing entries in the union to match naming style

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
