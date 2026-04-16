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

- **Rejection** — API responded (2xx) but returned an error object or otherwise communicated failure
- **Exception** — error caught in the catch clause of the API call

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
