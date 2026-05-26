# 05 - Role Management

## Goal
Let admins change a user's role — toggle between `user` and `admin` (or other roles if the schema is extended later).

## Dependencies
- **00-admin-page-redesign** — `ConfirmDialog`.
- **01-users-table** — row action + role badge column.

## Better Auth APIs
- `authClient.admin.setRole({ userId, role })` — `role` can be a string or string[].
- Permission gate: `user:set-role` (default: admin).
- Side effect: updates user's role. Existing sessions are NOT automatically re-issued. If your app reads `role` out of session data (vs. fresh from DB on each request), the target user may need to sign out / back in before the new role takes effect on the client. See "Optional server enhancement" below.
- Docs: https://www.better-auth.com/docs/plugins/admin#set-role

## UI

### Row action: Change role
- Item: `"Change role"`.
- Hidden when `user.id === currentUser.id` (admins should not demote themselves through this UI — risk of single-admin lockout).
- Opens `ConfirmDialog` with a body slot containing a `Select`:
  - Title: `Change role for ${user.email}?`
  - Description: shows `Current: ${currentRole} → New: ${selectedRole}`. Adds a warning if demoting an admin to user, and a stronger warning if this is the last admin.
  - Body: Shadcn `Select` with options derived from the `userRoles` constant in `src/server/constants.ts` — do NOT hardcode role strings.
  - Confirm label: `"Change role"`.
- On confirm: `setRole({ userId, role: selectedRole })` → toast `"Role updated"` → invalidate `['admin', 'users']`.

### Last-admin guard
Before showing the dialog (or on confirm), guard against demoting the last admin:
- Query: `authClient.admin.listUsers({ query: { filterField: 'role', filterValue: 'admin', limit: 1 /* count via total */ } })`.
- If `total === 1` AND target's current role is `admin` AND new role is non-admin → block confirm with a toast explaining "Cannot demote the last admin."

## Files
- **Modify** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — add `Change role` item.
- **Create** `src/client/routes/_authenticated/admin/-ChangeRoleDialog.tsx`.

## Optional server enhancement (the only good use of `refreshUserSessions`)
If your app reads `user.role` from cached session data (vs. always fresh from DB), the target user won't see their new role until they sign out and back in. To force-rotate their sessions after a role change, add a small custom Hono endpoint:

- **Create** `src/server/hono/adminRoutes.ts` route: `POST /refresh-user-sessions/:userId`.
  - Guarded by `adminMiddleware`.
  - Calls `auth.adapter.refreshUserSessions(targetUser)` (the 1.6.10 internalAdapter method — note `auth.adapter`, not `auth.api`).
  - Returns `{ ok: true }`.
- Client: after `setRole` succeeds, call the new endpoint.

**Skip this** if your app reads `role` fresh on every request (i.e., the session middleware re-fetches the user from the database, not from cookie cache). This codebase has `cookieCache.enabled: false` (`auth.ts:262`) and `deferSessionRefresh: true` (`auth.ts:253`), so sessions go to the DB on every check — meaning role changes are visible immediately on next request. **You probably don't need this enhancement.**

## Gotchas
- `setRole`'s `role` param can be `string | string[]`. Today the schema stores a single string. Keep the UI single-select unless you've extended the role schema.
- Available roles come from `userRoles` in `src/server/constants.ts`. Don't hardcode `'admin'` / `'user'` anywhere in the dialog or row actions.
- Self-role-change is hidden in the UI by design. If a user ever needs to demote themselves, another admin must do it.
- The last-admin guard is critical — without it, an admin can lock the whole org out of admin tooling.

## Acceptance criteria
- Admin can change another user's role via the dialog.
- Role badge in the table updates on success.
- Self-change is hidden in the row menu.
- Last-admin demotion is blocked with a clear error toast.
- Role options in the `Select` are derived from `userRoles`, not hardcoded.
