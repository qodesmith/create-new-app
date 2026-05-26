# 07 - Set User Password

## Goal
Let admins directly set/reset a user's password — a manual recovery path when the email-based reset doesn't work (lost email access, deliverability issues, etc.). Pair with auto-revoke-sessions because Better Auth's `setUserPassword` does NOT revoke existing sessions on its own. **This is the single biggest footgun on the whole admin page.**

## Dependencies
- **00-admin-page-redesign** — `ConfirmDialog` / `Dialog`.
- **01-users-table** — row action.
- (Soft dependency on the underlying API exposed in **06-session-management** — but this feature can call `authClient.admin.revokeUserSessions` directly without needing 06's UI.)

## Better Auth APIs
- `authClient.admin.setUserPassword({ userId, newPassword })`
- Permission gate: `user:set-password`.
- **Side-effect surprise**: does NOT revoke existing sessions. The target user remains signed in with their current session until natural expiry. This is the opposite of what most admins expect.
- Companion call: `authClient.admin.revokeUserSessions({ userId })` to force re-login.
- Docs: https://www.better-auth.com/docs/plugins/admin#set-user-password

## UI

### Row action
- Item: `"Set password"`.
- Hidden when `user.id === currentUser.id` (admins should change their own password through the normal account flow, which handles session continuity correctly).
- Opens a `Dialog`:
  - `newPassword` — text input with show/hide toggle AND a `"Generate"` button that fills a random 16-char password and shows a copy-to-clipboard control.
  - `confirmPassword` — must match `newPassword`.
  - **Checkbox**: `"Also sign user out of all devices"` (default: **CHECKED**, strongly recommended).
  - Warning copy (prominent): "Share this password with the user via a secure channel — it will not be shown again. If you don't sign them out of existing devices, anyone with their current session can continue using the account."
  - Submit: `"Set password"`, default variant. Disabled until both inputs match and pass validation.
- Validation: reuse `passwordValidator` from `src/server/db/auth/auth.ts:61` (`type(\`string >= ${minPasswordLength}\`)`) — or import `minPasswordLength` from `@/shared/constants` directly. Don't hardcode the length.
- On submit:
  1. `await setUserPassword({ userId, newPassword })`.
  2. If the checkbox is checked: `await revokeUserSessions({ userId })`.
  3. Toast `"Password updated"` (do NOT include the password value in the toast).
  4. Invalidate `['admin', 'users']` and `['admin', 'users', userId, 'sessions']` (if feature 06 is built).
  5. Close dialog only after the admin acknowledges they've saved the password (an "I've saved this password" checkbox unlocks the close button).

## Files
- **Modify** `src/client/routes/_authenticated/admin/-UserRowActions.tsx` — add `Set password` item.
- **Create** `src/client/routes/_authenticated/admin/-SetPasswordDialog.tsx`.

## Gotchas (security-critical)
- **The default-off behavior of `setUserPassword` regarding sessions is the worst footgun on this page.** The dialog MUST default to "also revoke sessions" checked, and the warning copy MUST be unmissable. Otherwise a compromised user might retain their existing session despite the password change.
- The generated password is shown once. Provide copy-to-clipboard and require an "I've saved this" acknowledgement before allowing close.
- **Never log the password value anywhere.** No `console.log`, no toast text containing the password, no audit-log row that stores the password. The toast should say only "Password updated" — nothing about the value.
- Reuse `passwordValidator` / `minPasswordLength` from existing code. Do not hardcode a length.
- Self-set-password is hidden — admins should use the normal account-page password-change flow, which preserves their own session correctly.

## Acceptance criteria
- Admin can set a new password for any user (except themselves).
- "Sign user out of all devices" checkbox defaults to checked and works when toggled.
- Password generator works and offers copy-to-clipboard.
- New password meets `minPasswordLength`.
- Dialog cannot be closed until the admin acknowledges they've saved the password.
- No password value appears in toasts, console output, or any logs (manual code review for this).
