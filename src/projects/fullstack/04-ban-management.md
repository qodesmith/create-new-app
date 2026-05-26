# 04 - Ban / Unban Users

## Goal
Let admins ban a user with an optional reason and optional expiry (timed ban). Banned users can't sign in until unbanned or until the ban expires. Banning automatically revokes all existing sessions — this is the preferred reversible alternative to delete (feature 02).

## Dependencies
- **00-admin-page-redesign** — `ConfirmDialog`.
- **01-users-table** — row action + status column.

## Better Auth APIs
- `authClient.admin.banUser({ userId, banReason?, banExpiresIn? })` — `banExpiresIn` is **seconds** from now (e.g. `60 * 60 * 24 * 7` = 1 week).
- `authClient.admin.unbanUser({ userId })`.
- Permission gate: `user:ban`.
- Side effects: `banUser` auto-revokes all existing sessions; subsequent sign-in is blocked with the configured `bannedUserMessage`.
- Docs: https://www.better-auth.com/docs/plugins/admin#ban-user

## Server-side config
In `src/server/db/auth/auth.ts` (the `admin({...})` call around line 403), add:
```ts
admin({
  defaultRole: userRoles.user,
  adminRoles: [userRoles.admin],
  defaultBanReason: 'Account suspended',
  bannedUserMessage:
    'This account has been suspended. Contact support if you believe this is an error.',
  // ...
}),
```
Update copy to match your product voice.

## UI

### Row action: Ban
- Item: `"Ban user"` (destructive variant).
- Hidden when `user.id === currentUser.id`.
- Hidden when `user.banned === true` (show "Unban" instead).
- Opens a `Dialog` (not pure `ConfirmDialog` — needs form inputs):
  - `banReason` — `Textarea`, optional.
  - `banExpiresIn` — `Select` with presets:
    - "Permanent" (sends `undefined` / omits `banExpiresIn`)
    - "1 hour" → `60 * 60`
    - "1 day" → `60 * 60 * 24`
    - "1 week" → `60 * 60 * 24 * 7`
    - "30 days" → `60 * 60 * 24 * 30`
    - "Custom" → reveals a numeric input + unit dropdown (hours/days)
  - Submit button: `"Ban user"`, destructive.
- On submit: `banUser({ userId, banReason, banExpiresIn })` → toast `"User banned"` → invalidate `['admin', 'users']`.

### Row action: Unban
- Item: `"Unban user"` (default variant).
- Shown only when `user.banned === true`.
- Opens `ConfirmDialog`:
  - Title: `Unban ${user.email}?`
  - Description: notes the user will be able to sign in again. Any active sessions remain revoked (they were terminated at ban time) so the user must sign in fresh.
  - Confirm: `"Unban"`, default variant.
- On confirm: `unbanUser({ userId })` → toast → invalidate `['admin', 'users']`.

### Status column (handled in feature 01)
Re-confirm the column shows a red "Banned" badge with hover tooltip displaying `banReason` and remaining time until `banExpires` (or "Permanent" if `banExpires` is null).

## Files
- **Modify** `src/server/db/auth/auth.ts` — add `defaultBanReason` and `bannedUserMessage` to the admin plugin config.
- **Modify** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — add `Ban user` / `Unban user` items.
- **Create** `src/client/routes/_authenticated/admin/-BanUserDialog.tsx`.

## Gotchas
- `banExpiresIn` is **seconds**, not ms. Convert from the UI select.
- Ban auto-revokes sessions — if you've also built feature 06 (session management), no need to also call `revokeUserSessions`.
- A banned user's data is preserved; this is a reversible "lock", unlike feature 02's hard delete. The dialog copy in feature 02 should suggest Ban as the preferred alternative for most "remove access" cases.
- For "Permanent", send `banExpiresIn: undefined` (or omit the key entirely). Don't send `0` or `null` unless the Better Auth version docs say to.
- Self-ban hidden (a self-banned admin loses the ability to unban themselves).

## Acceptance criteria
- Admin can ban a user with a reason and expiry; user's active sessions are immediately revoked.
- Banned user attempting to sign in sees the configured `bannedUserMessage`.
- Banned user's row shows red "Banned" badge with reason + time remaining on hover.
- Admin can unban; user can sign in again after a fresh login.
- Self-ban is hidden in the row menu.
- `defaultBanReason` and `bannedUserMessage` set explicitly in `auth.ts`.
