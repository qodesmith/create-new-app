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

Use `@tanstack/react-form` for forms, wrapped in the **Field design system** from `@/client/components/ui/field`. Never use the bare `<Label />` primitive or a raw `<label>` inside a form — always use `<Field>` + `<FieldLabel>`.

`<FieldLabel>` composes `<Label>` and adds `data-slot="field-label"`, the `group/field-label` + `peer/field-label` hooks, parent-`<Field>` disabled-state styling, and card-style checked states for checkbox/radio. The plain `<Label>` is for one-off labels outside forms.

```tsx
import {Field, FieldLabel} from '@/client/components/ui/field'
import {Input} from '@/client/components/ui/input'
import {useForm} from '@tanstack/react-form'

const form = useForm({
  defaultValues: {email: ''},
  onSubmitInvalid: handleFormSubmitInvalid,
  onSubmit: async ({value}) => { /* API call via RPC */ },
})

<form.Field
  name="email"
  validators={{
    onSubmit: ({value}) => (value ? undefined : 'Email is required'),
  }}
>
  {field => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input
        id="email"
        type="email"
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={field.state.meta.errors.length > 0}
      />
    </Field>
  )}
</form.Field>
```

Rules:
- One `<Field>` per logical input. Wrap multiple side-by-side fields in a flex container (see `signup.lazy.tsx` first/last name row).
- `<FieldLabel htmlFor="...">` pairs with the input's `id`. Omit `htmlFor` only when the input has no `id` (rare).
- Set `aria-invalid={field.state.meta.errors.length > 0}` on the input so the `data-invalid` styling on `<Field>` engages.
- Submit button via `form.Subscribe` for `canSubmit` / `isSubmitting` state.
- Errors surface via toast (`toast.error('Failed to ...')`) — not `<FieldError>` — to match the rest of the codebase. Use `onSubmitInvalid: handleFormSubmitInvalid` to toast validation failures.

Other Field parts available when needed: `<FieldGroup>` (gap container for stacked fields), `<FieldDescription>` (helper text under the label), `<FieldSet>` + `<FieldLegend>` (grouped legend), `<FieldSeparator>`. Reach for them only if the form actually needs them.

Canonical reference: `signup.lazy.tsx`. Also see `signin/route.lazy.tsx`, `reset-password.lazy.tsx`, `_authenticated/account/-Change*.tsx`.

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
