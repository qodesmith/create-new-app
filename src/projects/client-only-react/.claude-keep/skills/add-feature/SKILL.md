---
name: add-feature
description: Scaffold a client-side feature — route, components, state, and types. Use when user wants to add a new feature, build a new page, or create a new UI slice.
argument-hint: "[feature-description]"
---

# Add Feature

Client-side feature scaffolding across route, components, state, and types.

## Interview

Ask the developer before scaffolding:

- Feature name and brief description?
- What UI? List, form, detail view, dialog?
- Search params on the route?
- Code-split (lazy route)? Default: yes for larger features.
- Needs global state (Jotai atom)?
- Fetches external data (TanStack Query)?

## Scaffold Order

Each step validates before next:

1. Route file(s) — see [add-route](../add-route/SKILL.md)
2. Components — see [add-component](../add-component/SKILL.md)
3. Wire to TanStack Query if fetching external data

## Finalize

- Verify route renders and navigation works
- Check TanStack Router devtools for route registration

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
