---
name: add-route
description: Scaffold a TanStack Router page with file-based routing conventions. Use when user wants to add a new page, route, screen, or view.
argument-hint: "[route-path]"
---

# Add Route

## Interview

- Route name/path?
- Needs search params?
- Code-split (lazy)? Default: yes for non-trivial pages.
- Colocated components needed?

## Standard Route

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

## Code-Split Route (lazy)

Use for non-trivial pages to keep the initial bundle small.

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

## Layout Route

Use underscore-prefixed directories to group routes under a shared layout without affecting the URL.

`src/routes/_layout.tsx`:
```ts
import {createFileRoute, Outlet} from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <div>
      <nav>{/* shared nav */}</nav>
      <Outlet />
    </div>
  )
}
```

Child routes go in `src/routes/_layout/` and render inside the `<Outlet />`.

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

## Scoped Error Toasts

If the route shows an error toast AND navigates away on the success path, scope the toast so a stale "Failed to X" doesn't linger on the destination page after a quick retry succeeds (e.g. user fixes a form error, second submit succeeds, page navigates — and the previous error toast keeps showing for a few more seconds on the destination).

**Apply when**: `toast.error(...)` on failure AND `router.navigate(...)` (or `useNavigate`) on success in the same component.

**Skip when**: the form stays on the same page or the action just closes a dialog. With no navigation, the stale-toast bug can't occur.

Module-scope the ID + helper, then dismiss on unmount:

```tsx
const errorToastId = 'create-item-error'
const errorToast = (message: string) =>
  toast.error(message, {id: errorToastId})

function CreateItemPage() {
  // ...

  // every error site goes through the helper:
  errorToast('Failed to create item')

  useEffect(() => {
    return () => {
      toast.dismiss(errorToastId)
    }
  }, [])
}
```

Why it works:
- Sonner de-dupes by `id` — repeated failures replace the toast instead of stacking.
- Unmount cleanup catches every exit path (success navigate, sibling link, back button, tab close), not just the success branch.
- No ref bookkeeping, no per-render hook noise.

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
