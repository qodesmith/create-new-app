import type {User} from '@/client/types'

import {
  createApiAdminClient,
  createApiAuthClient,
  createApiClient,
  getAuthClient,
} from '@/client/apiClient'
import {authRoutePath} from '@/shared/constants'

import {atom} from 'jotai'
import {atomWithLazy, atomWithStorage} from 'jotai/utils'

// Corresponds to the user's preference in settings.
export const themeSettingAtom = atomWithStorage<'light' | 'dark' | 'system'>(
  // localStorage key.
  'ui-theme', // This exact string is also used in index.html

  // Initial value.
  'system',

  // Custom storage implementation (undefined uses localStorage).
  undefined,

  // Options - use the value in localStorage as the initial value.
  {getOnInit: true}
)

/**
 * The hardcoded 'dark' default is intentional. The visual theme is handled
 * immediately by the inline script in index.html (preventing FOUC), and
 * ThemeSetter in __root.tsx corrects this atom via useLayoutEffect before the
 * browser paints — so the stale default is never visible to the user.
 *
 * This is also SSR-safe: no localStorage or window access at module scope.
 */
// biome-ignore lint/style/useNamingConvention: internal use only
export const _themeAtom_INTERNAL_USE_ONLY = atom<'light' | 'dark'>('dark')

// The actual current theme - light or dark (defaults to dark).
export const themeSelector = atom<'light' | 'dark'>(get =>
  get(_themeAtom_INTERNAL_USE_ONLY)
)

export const userAtom = atom<User | null>(null)
export const userAvatarVersionAtom = atom(0)
export const userAvatarUrlSelector = atom(get => {
  const avatarVersion = get(userAvatarVersionAtom)
  return `${authRoutePath}/avatar?v=${avatarVersion}`
})
export const userInitialsAtom = atom<string>(get => {
  const user = get(userAtom)

  if (!user) return ''

  const first = user.name.trim()[0] ?? ''
  const last = user.lastName.trim()[0] ?? ''
  return `${first}${last}` || (user.name || 'U').slice(0, 2)
})

/**
 * SSR-safe: `atomWithLazy` defers client construction until the atom is first
 * read inside a store, so no `window` access happens at module scope and each
 * per-request store gets its own client instances — preventing state leaks
 * across concurrent server renders.
 */

// Better Auth RPC for authentication and user management.
export const authClientAtom = atomWithLazy(getAuthClient)

// Hono RPC for authenticated endpoints.
export const apiAuthClientAtom = atomWithLazy(createApiAuthClient)

// Hono RPC for admin endpoints.
export const apiAdminClientAtom = atomWithLazy(createApiAdminClient)

// Hono RPC for public endpoints.
export const apiClientAtom = atomWithLazy(createApiClient)
