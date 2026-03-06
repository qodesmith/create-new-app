# Route Reference

## File Locations

- Public: `src/client/routes/<name>.tsx` or `<name>.lazy.tsx`
- Auth-protected: `src/client/routes/_authenticated/<name>/route.tsx`

## Auth Route (code-split, most common)

Two files:

`src/client/routes/_authenticated/items/route.tsx`:
```ts
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/items')({})
```

`src/client/routes/_authenticated/items/route.lazy.tsx`:
```ts
import {createLazyFileRoute} from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/items')({
  component: ItemsPage,
})

function ItemsPage() {
  return <div>Items</div>
}
```

## Public Route (simple, no code-split)

`src/client/routes/about.tsx`:
```ts
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About</div>
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

Hyphen-prefixed, same folder as route:

```
_authenticated/items/
  route.tsx
  route.lazy.tsx
  -ItemCard.tsx
  -ItemForm.tsx
```

Import: `import {ItemCard} from './-ItemCard'`

## TanStack Form

Use `@tanstack/react-form` for forms. Pattern:

```tsx
const form = useForm({
  defaultValues: {title: '', body: ''},
  onSubmitInvalid: handleFormSubmitInvalid,
  onSubmit: async ({value}) => { /* API call via RPC */ },
})
```

Field → `form.Field`, submit → `form.Subscribe` for button state.
See `signup.lazy.tsx` for complete example.

## Accessing Auth Context

```ts
const user = useRouteContext({
  from: '/_authenticated',
  select: ({user}) => user,
})
```
