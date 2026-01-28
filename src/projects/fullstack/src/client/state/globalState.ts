import {getApiAuthClient, getApiClient, getAuthClient} from '@/client/apiClient'

import {atom} from 'jotai'
import {atomWithLazy, atomWithStorage} from 'jotai/utils'

// Corresponds to the user's preference in settings.
export const themeSettingAtom = atomWithStorage<'light' | 'dark' | 'system'>(
  'ui-theme',
  'system'
)

// The actual current theme - light or dark (default to dark).
export const themeAtom = atom<'light' | 'dark'>('dark')

export const loginTypeAtom = atom<'login' | 'signup'>('login')
export const shouldShowLoginSignupModalAtom = atom(false)

export const apiAuthClientAtom = atomWithLazy(getApiAuthClient)

export const apiClientAtom = atomWithLazy(getApiClient)

export const authClientAtom = atomWithLazy(getAuthClient)
