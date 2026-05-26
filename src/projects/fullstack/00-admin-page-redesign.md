# 00 - Admin Page Redesign (Foundation)

## Goal
Restructure `/admin` from a 2-column `AccountCard` grid into a sectioned layout that can host both the existing system tools and a new Users-management section. Add shared primitives that every later admin feature depends on.

## Dependencies
None. **Must be built first** — features 01–07 assume this layout and these primitives exist.

## Scope
1. Refactor `/admin` route layout into two sections: **Users** (top, full-width, empty placeholder for now) and **System** (below, hosts existing cards unchanged).
2. Move existing **Database Backup** and **Purge Stale Records** cards into the System section. No behavior changes.
3. Add a reusable `ConfirmDialog` primitive (Shadcn `AlertDialog`-based) for destructive actions.
4. Add a small `AdminSection` wrapper component: title + optional right-aligned action slot.

## Better Auth APIs used
None directly. This is layout/primitives only.

## Files to create / modify
- **Modify** `src/client/routes/_authenticated/admin/route.lazy.tsx` — replace existing 2-col grid with sectioned layout using the new `AdminSection`.
- **Create** `src/client/routes/_authenticated/admin/-AdminSection.tsx` — section wrapper.
- **Create** `src/client/components/ui/ConfirmDialog.tsx` (or wherever shared UI lives — follow conventions from existing components like `LoadingButton`).
- **Install** Shadcn `alert-dialog` if not present: `bunx shadcn@latest add alert-dialog`.

## Layout sketch
```
┌─ Admin ─────────────────────────────────────────────┐
│                                                     │
│ ## Users                          [+ Create user]   │  ← section header + action slot
│ ┌─────────────────────────────────────────────────┐ │
│ │ (placeholder — populated in feature 01)         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ## System                                           │
│ ┌──────────────────┐  ┌────────────────────────┐    │
│ │ Database Backup  │  │ Purge Stale Records    │    │
│ └──────────────────┘  └────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```
- Users section: full container width (consider `max-w-6xl` so the table breathes).
- System section: keep `max-w-3xl` so the existing cards retain their current size and feel.
- Vertical gap between sections (e.g. `space-y-12` or `gap-12`).

## Component APIs

### `AdminSection`
```tsx
type AdminSectionProps = {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode      // right-aligned slot (e.g. "Create user" button)
  children: React.ReactNode
}
```

### `ConfirmDialog`
```tsx
type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string         // default 'Confirm'
  cancelLabel?: string          // default 'Cancel'
  variant?: 'default' | 'destructive'   // styles confirm button
  onConfirm: () => void | Promise<void>
  isPending?: boolean           // shows spinner + disables buttons
  children?: React.ReactNode    // optional body slot (e.g. for inline form controls)
}
```

Used by features 02 (delete user), 03 (impersonate), 04 (unban), 05 (change role), 06 (revoke sessions), 07 (set password).

## Conventions
- Use existing `sonner` toast pattern (`import {toast} from 'sonner'`) — already in use across the codebase.
- Use `LoadingButton` for any async confirm button inside `ConfirmDialog`.

## Acceptance criteria
- Existing Backup and Purge cards still render and function identically.
- `/admin` renders new sectioned layout cleanly at mobile and desktop widths.
- `ConfirmDialog` is exercised somewhere (at minimum: a Storybook-style demo or wired into one existing destructive flow).
- `AdminSection` is reused by both Users (empty placeholder) and System.
