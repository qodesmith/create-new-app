# 01 - Users Table

## Goal
Add a paginated, searchable, sortable Users table to the Users section of `/admin`. This is the host surface for every per-user row action in features 02–07.

## Dependencies
- **00-admin-page-redesign** — Users section + `AdminSection` + `ConfirmDialog` must exist.

## Better Auth APIs
- Client: `authClient.admin.listUsers({ query: { searchValue?, searchField?, searchOperator?, limit?, offset?, sortBy?, sortDirection?, filterField?, filterOperator?, filterValue? } })`
- Permission gate: `user:list` (default: admin role only)
- Returns: `{ users: User[], total: number, limit: number, offset: number }`
- Docs: https://www.better-auth.com/docs/plugins/admin#list-users

**No custom Hono endpoint needed.** The admin plugin mounts `/api/auth/admin/list-users` automatically — the existing `adminClient()` plugin in `src/client/apiClient.ts:69` already wires the client.

## UI

### Table (Shadcn `data-table` + TanStack Table)
- Install if not present: `bunx shadcn@latest add table` and adapt the data-table recipe (https://ui.shadcn.com/docs/components/data-table).
- Columns:
  - **Name** — `name + lastName` (with avatar/initial bubble).
  - **Email** — `email` (with verified ✓ icon if `emailVerified`).
  - **Role** — badge (`admin` distinct color).
  - **Status** — `Banned` badge if `user.banned === true`; tooltip shows `banReason` + remaining time to `banExpires`.
  - **Created** — `createdAt` formatted with existing date util.
  - **Actions** — `...` dropdown menu (slot populated by features 02–07).

### Header controls (inside the `AdminSection` body, above the table)
- Search input (debounced 250ms). Default `searchField: 'email'` with a dropdown to switch to `name`.
- Page-size selector: 10 / 25 / 50.
- Pagination: prev / next + `Page X of Y` indicator (derived from `total` and `pageSize`).
- Sort: click column headers (Name / Email / Role / Created) to toggle asc/desc.

### Header right-action slot
- "+ Create user" button (lives in `AdminSection`'s `action` prop). Wiring of the dialog is in feature 02 — for this feature, render the button but have it open a placeholder.

## Files
- **Modify** `src/client/routes/_authenticated/admin/route.lazy.tsx` — mount `<UsersTable />` inside the Users section.
- **Create** `src/client/routes/_authenticated/admin/-UsersTable.tsx` — table + header controls.
- **Create** `src/client/routes/_authenticated/admin/-usersTableColumns.tsx` — column defs (kept separate so per-feature row actions can be wired cleanly).
- **Create** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — row actions dropdown component. Empty for now (or one placeholder item). Each subsequent feature adds menu items here.
- **Create** the Shadcn `data-table` primitive at the standard location if not already present.

## State management
- TanStack Query key: `['admin', 'users', { searchValue, searchField, sortBy, sortDirection, page, pageSize }]`.
- Query fn: `() => authClient.admin.listUsers({ query: {...} })`.
- Use `placeholderData: keepPreviousData` (TanStack Query v5) so pagination doesn't flash empty.
- Convention: every mutating row action in features 02–07 invalidates `['admin', 'users']` on success.

## Gotchas
- `listUsers` pagination uses `limit` / `offset`, not `page`. Convert: `offset = (page - 1) * pageSize`, `limit = pageSize`.
- `searchField` accepts `'email' | 'name'` only (verify in your installed version).
- The current admin user must not be a target for self-destructive actions in later features — pass `currentUser.id` down to `UserRowActions` so each item can hide itself when `user.id === currentUser.id`. The currently signed-in session is available via `authClient.useSession()` or the existing session atom.
- Banned users should be visually distinct (muted row + red badge) but still clickable for row actions (e.g. Unban).
- Admins should be marked visually so the viewer knows `user:impersonate-admins` is required (feature 03).

## Acceptance criteria
- Table loads on `/admin`, shows all users with paging.
- Searching by email/name filters server-side.
- Sorting by column header re-queries with `sortBy` / `sortDirection`.
- Pagination works in both directions; total count matches the server.
- Banned users visually distinct; tooltip shows reason + expiry.
- Row `...` menu opens (empty/placeholder for now).
- "+ Create user" button renders in the section header.
