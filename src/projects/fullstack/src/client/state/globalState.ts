import {getApiAuthClient, getApiClient, getAuthClient} from '@/client/apiClient'

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

export const isSignedInAtom = atom(false)

// RPC for Better Auth endpoints.
export const authClientAtom = atomWithLazy(getAuthClient)

// Hono RPC for custom authenticated endpoints.
export const apiAuthClientAtom = atomWithLazy(getApiAuthClient)

// Hono RPC for custom public endpoints.
export const apiClientAtom = atomWithLazy(getApiClient)
