---
name: add-route
description: Scaffold a TanStack Router page with file-based routing conventions. Use when user wants to add a new page, route, screen, or view.
argument-hint: "[route-path]"
---

# Add Route

## Interview

- Route name/path?
- Needs search params?
- Code-split (lazy)? Default: yes for larger features.
- Colocated components needed?

## Public Route (no code-split)

`src/routes/about.tsx`:
```ts
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About</div>
}
```

## Code-Split Route

`src/routes/items/route.tsx`:
```ts
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/items')({})
```

`src/routes/items/route.lazy.tsx`:
```ts
import {createLazyFileRoute} from '@tanstack/react-router'

export const Route = createLazyFileRoute('/items')({
  component: ItemsPage,
})

function ItemsPage() {
  return <div>Items</div>
}
```

## Search Params

```ts
import type {SearchSchemaInput} from '@tanstack/react-router'

export const Route = createFileRoute('/items')({
  validateSearch: (
    search: {page?: number} & SearchSchemaInput
  ): {page?: number} => ({page: search.page}),
})
```

## Colocated Components

Hyphen-prefixed files in same folder — TanStack Router ignores these:
```
-ItemCard.tsx
-ItemForm.tsx
```

Import: `import {ItemCard} from './-ItemCard'`

## TanStack Form

Use `@tanstack/react-form` for forms:

```tsx
const form = useForm({
  defaultValues: {title: '', body: ''},
  onSubmitInvalid: handleFormSubmitInvalid,
  onSubmit: async ({value}) => { /* handle submission */ },
})
```

Field → `form.Field`, submit → `form.Subscribe` for button state.

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
