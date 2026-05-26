# 03 - User Impersonation

## Goal
Let admins masquerade as another user to debug user-reported issues. Pair with a global app-shell banner so the admin always knows they're impersonating and can exit with one click.

## Dependencies
- **00-admin-page-redesign** — `ConfirmDialog`.
- **01-users-table** — row action menu.

## Better Auth APIs
- `authClient.admin.impersonateUser({ userId })` — creates a temporary session as the target user. Default duration: 1 hour. Configurable via the admin plugin's `impersonationSessionDuration` option.
- `authClient.admin.stopImpersonating()` — terminates the impersonation session and restores the admin's original session.
- Permission gates:
  - `user:impersonate` — required to impersonate any user.
  - `user:impersonate-admins` — required additionally to impersonate another admin.
- Detection: during impersonation the active session row has an `impersonatedBy` field set to the admin's user id.
- Docs: https://www.better-auth.com/docs/plugins/admin#impersonate-user

## Server-side config update
In `src/server/db/auth/auth.ts` (the `admin({...})` call around line 403), explicitly set `impersonationSessionDuration` so the choice is obvious in code review:
```ts
admin({
  defaultRole: userRoles.user,
  adminRoles: [userRoles.admin],
  impersonationSessionDuration: 60 * 60,  // 1 hour
}),
```
Pick a value that matches your security posture — shorter is safer.

## UI

### Row action
- Item: `"Impersonate"`.
- Hidden when `user.id === currentUser.id`.
- For target users with role `admin`: dim/disable unless current admin has `user:impersonate-admins`. Use `authClient.admin.checkRolePermission({ role: currentUser.role, permissions: { user: ['impersonate-admins'] } })` (client-side, no network call).
- On click: open `ConfirmDialog`:
  - Title: `Impersonate ${user.email}?`
  - Description: "You'll be signed in as this user. Use the banner at the top to stop impersonating and return to your admin session."
  - Confirm: `"Impersonate"`, variant: `default`.
- On confirm: `await impersonateUser({ userId })` → navigate to `defaultAuthedPath` (or `/`) so the impersonated session lands on the target user's home view → invalidate session query (`authClient.useSession()` should refresh).

### Global impersonation banner
- New component `src/client/components/ImpersonationBanner.tsx`.
- Mount in the root authenticated layout (likely `src/client/routes/_authenticated/route.tsx` or whichever file contains the app shell).
- Visible only when `session.session.impersonatedBy` is truthy.
- Sticky top, distinct color (amber/yellow).
- Shows: `Impersonating {user.email} — [Stop impersonating]`.
- "Stop impersonating" button calls `await authClient.admin.stopImpersonating()` → navigate back to `/admin` → invalidate session query.

## Files
- **Modify** `src/server/db/auth/auth.ts` — add `impersonationSessionDuration` to the admin plugin config.
- **Modify** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — add the Impersonate item.
- **Create** `src/client/components/ImpersonationBanner.tsx`.
- **Modify** the authenticated layout file (likely `src/client/routes/_authenticated/route.tsx`) — render `<ImpersonationBanner />` near the top of the shell.
- **Verify** `auth.$Infer.Session` includes `impersonatedBy` (it should, via the admin plugin's session extension). If a type regeneration step is needed, do that.

## Gotchas
- The impersonation session is a real session row. Do NOT delete it via feature 06's revoke UI while still impersonating — call `stopImpersonating` instead, otherwise the admin's session restoration won't run.
- Actions performed while impersonating are attributed to the impersonated user in the regular flow. If you keep custom audit logs (the existing backup audit table is an example pattern), consider also recording `impersonatedBy` for forensic clarity. Out of scope for this feature unless you have specific audit-log requirements.
- After `impersonateUser`, the client cookie now holds the impersonated session. The admin's original session is preserved server-side and restored by `stopImpersonating`.
- Self-impersonation must be hidden (no-op + confusing).

## Acceptance criteria
- Admin clicks "Impersonate" on a user row → page reloads as that user.
- Banner appears at the top with the impersonated user's email + "Stop impersonating" button.
- Clicking "Stop impersonating" restores the admin's original session and removes the banner.
- Self-impersonation hidden in row menu.
- Admin-on-admin impersonation gated by `user:impersonate-admins`.
- `impersonationSessionDuration` is set explicitly in `auth.ts`.
