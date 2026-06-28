import type {User} from '@/client/types'

import {
  createApiAdminClient,
  createApiAuthClient,
  createApiClient,
  getAuthClient,
} from '@/client/apiClient'
import {getUserInitials} from '@/client/lib/utils'
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
themeSettingAtom.debugLabel = 'themeSettingAtom'

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
_themeAtom_INTERNAL_USE_ONLY.debugLabel = '_themeAtom_INTERNAL_USE_ONLY'

// The actual current theme - light or dark (defaults to dark).
export const themeSelector = atom<'light' | 'dark'>(get =>
  get(_themeAtom_INTERNAL_USE_ONLY)
)
themeSelector.debugLabel = 'themeSelector'

export const userAtom = atom<User | null>(null)
userAtom.debugLabel = 'userAtom'

export const userAvatarVersionAtom = atom(0)
userAvatarVersionAtom.debugLabel = 'userAvatarVersionAtom'

export const userAvatarUrlSelector = atom(get => {
  const avatarVersion = get(userAvatarVersionAtom)
  return `${authRoutePath}/avatar?v=${avatarVersion}`
})
userAvatarUrlSelector.debugLabel = 'userAvatarUrlSelector'

export const userInitialsAtom = atom<string>(get => {
  const user = get(userAtom)
  if (!user) return ''
  return getUserInitials(user)
})
userInitialsAtom.debugLabel = 'userInitialsAtom'

/**
 * SSR-safe: `atomWithLazy` defers client construction until the atom is first
 * read inside a store, so no `window` access happens at module scope and each
 * per-request store gets its own client instances — preventing state leaks
 * across concurrent server renders.
 */

// Better Auth RPC for authentication and user management.
export const authClientAtom = atomWithLazy(getAuthClient)
authClientAtom.debugLabel = 'authClientAtom'

// Hono RPC for authenticated endpoints.
export const apiAuthClientAtom = atomWithLazy(createApiAuthClient)
apiAuthClientAtom.debugLabel = 'apiAuthClientAtom'

// Hono RPC for admin endpoints.
export const apiAdminClientAtom = atomWithLazy(createApiAdminClient)
apiAdminClientAtom.debugLabel = 'apiAdminClientAtom'

// Hono RPC for public endpoints.
export const apiClientAtom = atomWithLazy(createApiClient)
apiClientAtom.debugLabel = 'apiClientAtom'
