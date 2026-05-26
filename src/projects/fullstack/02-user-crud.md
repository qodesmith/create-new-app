# 02 - Create / Edit / Delete User

## Goal
Full CRUD on user records: admin can create new users from scratch, edit existing user fields (name, lastName, custom additionalFields), and hard-delete users.

## Dependencies
- **00-admin-page-redesign** — `ConfirmDialog`.
- **01-users-table** — row actions menu, "+ Create user" header button.

## Better Auth APIs

### Create
- `authClient.admin.createUser({ email, password, name, role?, data?: { lastName, ... } })`
- Permission gate: `user:create`.
- Side effects: stores user with `emailVerified: true` (admin creation bypasses the verification email flow); does NOT send a welcome email.
- Docs: https://www.better-auth.com/docs/plugins/admin#create-user

### Update
- `authClient.admin.updateUser({ userId, data: { name, lastName, ... } })`
- Permission gate: admin role.
- Side effect: target user's existing sessions reflect new data on next fetch (the plugin invalidates internally).
- Docs: https://www.better-auth.com/docs/plugins/admin (Update user)

### Delete
- `authClient.admin.removeUser({ userId })`
- Permission gate: `user:delete`.
- Side effect: **hard delete** — cascades to sessions, accounts, passkeys, verification rows. Irreversible.
- Docs: https://www.better-auth.com/docs/plugins/admin#remove-user

**No custom Hono endpoint needed for any of these.**

## UI

### Create
- The "+ Create user" button in the Users section header (rendered by feature 01) opens a Shadcn `Dialog`.
- Form fields:
  - `email`
  - `name` (first name)
  - `lastName`
  - `password` — text input with show/hide toggle AND a "Generate" button that fills a random 16-char password and shows a copy-to-clipboard control.
  - `role` — `Select` with options derived from `userRoles` in `src/server/constants.ts`. Default `user`.
- Reuse the existing Arktype validators from `src/server/db/auth/auth.ts:60-62` (`emailValidator`, `nameValidator`, `passwordValidator`). If they're not already exported from a shared module, lift them into `src/shared/validators.ts` (or similar) so both server and client can use the same rules. Don't duplicate.
- Success: toast `"User {email} created"` + invalidate `['admin', 'users']` + close dialog.
- Error: toast with server message.

### Edit
- Row action: `"Edit user"` (default variant).
- Opens a Shadcn `Dialog` with form: `name`, `lastName`. (Email change must go through Better Auth's two-step `changeEmail` flow on the user's own account page — do NOT expose admin email edit here.)
- Pre-populates from the row's user data.
- Success: toast `"User updated"` + invalidate `['admin', 'users']`.

### Delete
- Row action: `"Delete user"` (destructive variant).
- Hidden when `user.id === currentUser.id`.
- Opens `ConfirmDialog`:
  - Title: `Delete ${user.email}?`
  - Description: explicit warning — this is permanent, cascades to sessions / accounts / passkeys / verification rows; suggest considering Ban (feature 04) as a reversible alternative.
  - Confirm label: `"Delete user"`, variant: `destructive`.
- Success: toast + invalidate `['admin', 'users']`. Row vanishes on next refetch.

## Files
- **Modify** `src/client/routes/_authenticated/admin/-UsersTable.tsx` — wire `"+ Create user"` button to open `CreateUserDialog`.
- **Modify** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — add `Edit user` and `Delete user` menu items.
- **Create** `src/client/routes/_authenticated/admin/-CreateUserDialog.tsx`.
- **Create** `src/client/routes/_authenticated/admin/-EditUserDialog.tsx`.
- **Maybe create** `src/shared/validators.ts` if the Arktype validators don't already have a shared home.

## Gotchas
- `lastName` is a required additionalField in `src/server/db/auth/auth.ts:268-272`. Better Auth's typing for additionalFields in `createUser` varies between versions — verify whether to pass it under `data: { lastName }` or at the top level. Check `auth.$Infer.User` for the canonical shape.
- Hard delete is irreversible. The dialog copy must make this clear and suggest Ban (feature 04) for most "remove access" use cases.
- `createUser` does not trigger the email-verification flow; the new user is created with `emailVerified: true`. If you want them to verify their own email, you'd have to manually toggle that — not recommended for an admin-initiated flow.
- The generated password from the Create dialog is shown once. Add a copy-to-clipboard button and consider requiring an "I've saved this" acknowledgement before allowing close. Never log the password value.

## Acceptance criteria
- Admin can create a new user; user appears in the table on next refresh.
- Admin can edit a user's name and lastName; changes persist.
- Admin can delete a user with confirmation; user disappears from table.
- Self-delete is hidden in the row menu.
- No password value ever appears in toasts, console, or audit logs.
