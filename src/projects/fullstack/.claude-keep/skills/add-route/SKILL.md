---
name: add-route
description: Scaffold a TanStack Router page with file-based routing conventions. Use when user wants to add a new page, route, screen, or view.
argument-hint: "[route-path]"
---

# Add Route

## Interview

- Route name/path?
- Auth-protected or public?
- Needs search params?
- Code-split (lazy)? Default: yes for auth routes.
- Colocated components needed?

## Auth Route (code-split) — most common

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

## Public Route (no code-split)

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

Hyphen-prefixed files in same folder — TanStack Router ignores these:
```
-ItemCard.tsx
-ItemForm.tsx
```

Import: `import {ItemCard} from './-ItemCard'`

## Auth Context Access

```ts
const user = useRouteContext({
  from: '/_authenticated',
  select: ({user}) => user,
})
```

## TanStack Form

Use `@tanstack/react-form` for forms:

```tsx
const form = useForm({
  defaultValues: {title: '', body: ''},
  onSubmitInvalid: handleFormSubmitInvalid,
  onSubmit: async ({value}) => { /* API call via RPC */ },
})
```

Field → `form.Field`, submit → `form.Subscribe` for button state.
See `signup.lazy.tsx` for complete example.

### Password Manager Autofill

For forms with password fields but no visible username or email field (e.g. change-password, delete-account), include `<PasswordManagerHint />` so password managers can associate the username with the password field:

```tsx
import {PasswordManagerHint} from '@/client/components/custom/PasswordManagerHint'

<form>
  <PasswordManagerHint />
  <PasswordInput autoComplete="current-password" />
</form>
```

Not needed when the form already has a username or email field (e.g. login, signup).

## Scoped Error Toasts

If the route shows an error toast AND navigates away on the success path, scope the toast so a stale "Failed to X" doesn't linger on the destination page after a quick retry succeeds (e.g. user mistypes password, sees "Failed to sign in", retypes the missing character, lands on `/account` — toast keeps showing for a few more seconds).

**Apply when**: `toast.error(...)` on failure AND `router.navigate(...)` on success in the same component.

**Skip when**: the form stays on the same page (e.g. ChangePassword, ChangeEmail) or the action just closes a dialog (e.g. ResetPasswordDialog). With no navigation, the stale-toast bug can't occur.

Module-scope the ID + helper, then dismiss on unmount:

```tsx
const errorToastId = 'signin-error'
const errorToast = (message: string) =>
  toast.error(message, {id: errorToastId})

function SignInPage() {
  // ...

  // every error site goes through the helper:
  errorToast('Failed to sign in')

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

Canonical reference: `signin/route.lazy.tsx`.

See [CONVENTIONS](../CONVENTIONS.md) for finalize steps and rules.
