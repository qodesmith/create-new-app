import {themeSettingAtom} from '@/state/globalState'

import {useSetAtom} from 'jotai'
import {useCallback} from 'react'

export function useCycleTheme() {
  const setThemeSetting = useSetAtom(themeSettingAtom)

  return useCallback(() => {
    setThemeSetting(theme => {
      switch (theme) {
        case 'dark':
          return 'light'
        case 'light':
          return 'system'
        default:
          return 'dark'
      }
    })
  }, [setThemeSetting])
}
