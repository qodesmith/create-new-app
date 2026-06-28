---
name: add-error-context
description: Add a new entry to the errorContexts array in src/shared/constants.ts. Use when adding error tracking for server-side operations or genuine client-side catch-clause errors.
argument-hint: "[error-context-description]"
---

# Add ErrorContext Entry

Add a new entry to the `errorContexts` array in `src/shared/constants.ts`. That
array is the single source of truth; the `ErrorContext` union in
`src/shared/types.d.ts` derives itself from it via `(typeof errorContexts)[number]`,
so you never edit the type directly — adding an array element updates the type
everywhere.

## Philosophy

Only log errors that represent a real bug signal. Expected user-error responses (wrong password, oversized upload, expired reset token, cancelled WebAuthn prompt, etc.) get surfaced via the UI but are **not** logged anywhere — they're normal flow, not telemetry.

## Naming Convention

Format: `<service>:<operation>:<suffix>`

Three colon-separated parts. `<suffix>` is always lowercase: `rejection` or `exception`.

### Server-side rejections — for bug-signal non-2xx responses

```ts
'<service>:<operation>:rejection',
```

Use when the server returns a non-2xx that shouldn't normally happen — e.g. an operation with no user-error failure mode where a 4xx/5xx points to a server-side problem worth investigating.

- `<service>` is the subsystem returning the response (`hono`, `betterAuth`, etc.)
- Log inline at the point the response is generated; do **not** rely on the client to round-trip the error back

Do NOT add a rejection context for operations where non-2xx is expected user behavior (login with wrong password, signup with taken email, oversized file). Those go through the UI silently.

### Server-side calls to external services — rejection + exception pair

```ts
'<service>:<operation>:rejection',
'<service>:<operation>:exception',
```

- **rejection** — service responded but indicated failure (e.g. Resend returned `{error: ...}`)
- **exception** — error caught in the catch clause (network/timeout)
- `<service>` is the external service name (e.g. `resend`, `stripe`)

### Catch-clause exceptions — exception only

```ts
'<area>:<name>:exception',
```

For genuine errors caught in a try/catch:
- Server: top-level error handlers, scheduled jobs, etc. (`<area>` = `hono`, `betterAuth`, `dbCleanup`, etc.)
- Client: errors thrown inside `mutationFn` / `queryFn` that aren't a `DetailedError` (network/CORS failure, JSON parse error, code throw). `<area>` = `client`.

Client code does **not** log `DetailedError` (non-2xx response from server) — the server logs those at the source if they're worth logging. The client only logs genuine exceptions.

## Rules

- `<service>`, `<operation>`, and `<area>` are camelCase; `<suffix>` is lowercase (`rejection` | `exception`)
- Place new entries in the correct section (Server or Client) of the `errorContexts` array, with a comment if starting a new group
- Check existing entries in the array to match naming style

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
