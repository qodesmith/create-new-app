---
name: add-error-context
description: Add a new entry to the ErrorContext union type in src/shared/errorContext.ts. Use when adding persisted error capture for service calls or catch-all handlers.
argument-hint: "[error-context-description]"
---

# Add ErrorContext Entry

Add a new entry to the `ErrorContext` union type in `src/shared/errorContext.ts`.

## Naming Convention

Format: `<service>:<operation>:<outcome>`

### 1. Client-side failures — Exception only

```ts
| 'client:<operation>:exception'
```

Client capture is only for failures the server cannot observe directly, such as network/CORS failures, aborted requests, browser runtime exceptions, or render/loader failures.

Do not add `client:*:rejection` contexts for expected product or validation outcomes. If the server returned the response, either it is expected UX (do not capture) or the server should capture it directly.

### 2. Server-side async calls to external services — Rejection + Exception pair

```ts
| '<service>:<operation>:rejection'
| '<service>:<operation>:exception'
```

- `rejection` means the external service responded but indicated failure
- `exception` means the call threw before receiving a service response
- `<service>` is the external service name (e.g. `resend`, `stripe`, etc.)

### 3. Standalone error scenarios — Exception only

```ts
| '<area>:<name>:exception'
```

- For catch-all handlers or one-off error scenarios with no corresponding rejection
- `<area>` is the service or subsystem (e.g. `hono`, `betterAuth`, etc.)

## Rules

- Use camelCase for `<service>` and `<operation>`
- Use lowercase `rejection` or `exception` for `<outcome>`
- Place new entries in the correct section (Server or Client) with a comment if starting a new group
- Check existing entries in the union to match naming style
- Capture server-known failures with `captureError` from `src/server/errorCapture/captureError.ts`
- Capture browser-only failures with `useCaptureError` from `src/client/hooks/useCaptureError.ts`

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
