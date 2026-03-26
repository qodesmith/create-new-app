import {atom} from 'jotai'
import {atomWithStorage} from 'jotai/utils'

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

// biome-ignore lint/style/useNamingConvention: internal use only
export const _themeAtom_INTERNAL_USE_ONLY = atom<'light' | 'dark'>('dark')

// The actual current theme - light or dark (default to dark).
export const themeSelector = atom<'light' | 'dark'>(get =>
  get(_themeAtom_INTERNAL_USE_ONLY)
)
