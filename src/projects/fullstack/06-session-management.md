# 06 - Session Management

## Goal
Let admins view all active sessions for a given user and revoke them — either a single session (e.g. one suspicious device) or all sessions at once (force sign-out everywhere).

## Dependencies
- **00-admin-page-redesign** — `ConfirmDialog`.
- **01-users-table** — row action menu.

## Better Auth APIs
- `authClient.admin.listUserSessions({ userId })` → returns `{ sessions: Session[] }`.
- `authClient.admin.revokeUserSession({ sessionToken })` — revoke a single session by its token (NOT by id).
- `authClient.admin.revokeUserSessions({ userId })` — revoke all sessions for a user.
- Permission gates: `session:list`, `session:revoke`, `session:delete`.
- Docs: https://www.better-auth.com/docs/plugins/admin (session section)

## UI

### Row action: Manage sessions
- Item: `"Manage sessions"`.
- Opens a Shadcn `Dialog` (or `Sheet` if you prefer a side drawer) titled `Sessions for ${user.email}`.

### Dialog body
- Sessions list, columns:
  - **Device** — parsed from `session.userAgent`. Use a small UA parser helper; fall back to the raw UA string if parsing fails. (Add `ua-parser-js` to deps, or roll a minimal parser — keep it simple.)
  - **IP** — `session.ipAddress`.
  - **Created** — `session.createdAt` formatted with existing date util.
  - **Expires** — `session.expiresAt`.
  - **Status** — visually mark with a chip if `session.impersonatedBy` is set ("Impersonation session"), or if it's the current viewer's own session.
  - **Action** — per-row `"Revoke"` button.

### Per-row revoke
- Click `"Revoke"` → optimistic UI (mark row "Revoking…") → `revokeUserSession({ sessionToken: session.token })` → on success, refetch sessions list and toast `"Session revoked"`.

### Footer: Revoke all
- Destructive button: `"Revoke all sessions"`.
- Opens a nested `ConfirmDialog`:
  - Title: `Revoke all sessions for ${user.email}?`
  - Description: "They will be signed out from every device. They can sign in again immediately."
  - Confirm: `"Revoke all"`, destructive.
- On confirm: `revokeUserSessions({ userId })` → toast → close both dialogs → invalidate `['admin', 'users', userId, 'sessions']` and `['admin', 'users']`.

## Files
- **Modify** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — add `Manage sessions` item.
- **Create** `src/client/routes/_authenticated/admin/-UserSessionsDialog.tsx`.
- **Maybe create** `src/client/utils/parseUserAgent.ts` if you want a tiny in-house parser.

## State management
- Query key: `['admin', 'users', userId, 'sessions']`.
- Fetch on dialog open (`enabled: dialogOpen`).
- Invalidate after every revoke mutation.

## Gotchas
- `revokeUserSession` takes `sessionToken`, NOT `sessionId`. Use `session.token` from `listUserSessions`'s response. Double-check the field name in your installed Better Auth version (some older docs say `sessionId`).
- If the admin opens their own row's sessions and revokes them, the admin gets signed out immediately. Consider hiding the current admin's own session from the list (or marking it "This session — use the account page to sign out") to avoid accidental self-logout.
- Active impersonation sessions appear in this list. Revoking an impersonation session via this UI works but does NOT restore the admin's original session — they'll be signed out entirely. The "Stop impersonating" banner button (feature 03) is the correct exit path. Document this in the dialog.
- After a ban (feature 04), the user's sessions are already revoked — the sessions list will be empty. That's expected.

## Acceptance criteria
- Admin can open the sessions dialog and see all active sessions for any user.
- Admin can revoke a single session; row disappears, target session terminated.
- Admin can revoke all sessions with confirmation; all rows disappear, target user signed out everywhere.
- Impersonation sessions are visually distinct.
- The viewer's own session is either hidden from their own user's sessions list, or clearly marked to discourage self-revoke.
