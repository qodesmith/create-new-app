import {Button} from '@/client/components/ui/button'
import {themeSelector, themeSettingAtom} from '@/client/state/globalState'

import {useAtom, useAtomValue} from 'jotai'

export function Appearance() {
  const [themeSetting, setThemeSetting] = useAtom(themeSettingAtom)
  const theme = useAtomValue(themeSelector)

  return (
    <>
      <p className="mb-0 text-sm">
        Current setting - <span className="font-bold">{themeSetting}</span>
        {themeSetting === 'system' ? (
          <span className="text-xs italic">&nbsp;({theme})</span>
        ) : (
          ''
        )}
      </p>
      <p className="text-muted-foreground text-sm">
        Choose how the app looks. Your preference is saved on this device.
        "System" follows your device setting.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant={themeSetting === 'light' ? 'default' : 'outline'}
          onClick={() => setThemeSetting('light')}
        >
          Light
        </Button>
        <Button
          type="button"
          size="sm"
          variant={themeSetting === 'dark' ? 'default' : 'outline'}
          onClick={() => setThemeSetting('dark')}
        >
          Dark
        </Button>
        <Button
          type="button"
          size="sm"
          variant={themeSetting === 'system' ? 'default' : 'outline'}
          onClick={() => setThemeSetting('system')}
        >
          System
        </Button>
      </div>
    </>
  )
}
