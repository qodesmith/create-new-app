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

// The actual current theme - light or dark (default to dark).
export const themeAtom = atom<'light' | 'dark'>('dark')

export const loginTypeAtom = atom<'login' | 'signup'>('login')

export const apiAuthClientAtom = atomWithLazy(getApiAuthClient)

export const apiClientAtom = atomWithLazy(getApiClient)

export const authClientAtom = atomWithLazy(getAuthClient)

export const isSignedInAtom = atom(false)
