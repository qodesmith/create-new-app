---
name: add-error-context
description: Add a new entry to the ErrorContext union type in src/shared/types.d.ts. Use when adding error tracking for API calls, service calls, or catch-all handlers.
argument-hint: "[error-context-description]"
---

# Add ErrorContext Entry

Add a new entry to the `ErrorContext` union type in `src/shared/types.d.ts`.

## Naming Convention

Format: `<service>:<operation>:<suffix>` — three colon-separated segments. Suffix is lowercase, one of:

- `:exception` — code threw or a third-party call raised inside a try/catch
- `:rejection` — a third party returned a non-success response we treat as an error (e.g. Resend API error, Better Auth handler returning 5xx)

## What gets captured (and what doesn't)

The `errors` table stores genuine system errors. Things that are **expected UX** are not errors and must not be captured:

- Wrong password, validation 400s, expired tokens, "file too large" — user input, the system worked.
- 4xx responses generally — the server is correctly telling the client the request was bad.

Capture only when something genuinely went wrong: code threw, the network failed, a third party returned 5xx, etc.

## Where to capture

| Site                              | Suffix     | Example                                          |
|-----------------------------------|------------|--------------------------------------------------|
| Server `try/catch` of own code    | `:exception` | `hono:topLevel:exception`                      |
| Server wrapper of 3rd-party SDK   | `:exception` | `resend:sendResetPasswordEmail:exception`      |
| 3rd-party returns failure result  | `:rejection` | `resend:sendResetPasswordEmail:rejection`      |
| Black-box handler returns 5xx     | `:rejection` | `betterAuth:topLevel:rejection`                |
| Standalone server invariant      | `:exception` | `dbCleanup:purgeStaleRecords:exception`        |
| Client `catch (error)` of fetch   | `:exception` | `client:signIn:exception`                      |
| React error boundary              | `:exception` | `client:topLevel:exception`                    |

**There are no `client:*:rejection` contexts.** Rejection-class outcomes — the server told the client a request failed — are server-owned. The server captures them at the source (or doesn't capture, if the failure is expected UX). The client only captures what only the client can see: catch-block exceptions and React render failures.

## Capturing the error

Server: `captureError({context, error, metadata?, userId?})` from `@/server/utils/captureError`.

```ts
import {captureError} from '@/server/utils/captureError'

captureError({context: 'myService:myOp:exception', error})
```

Client: `useCaptureError()` returns `({error, context, metadata?}) => void`.

```ts
import {useCaptureError} from '@/client/hooks/useCaptureError'

const captureError = useCaptureError()
captureError({error, context: 'client:myFeature:exception'})
```

## Rules

- camelCase the `<service>` and `<operation>` segments
- `<suffix>` is lowercase
- Place the new entry in the correct section (Server or Client) of the union
- Match existing entries' style; check the union before adding

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
