import {Button} from '@/components/ui/button'
import {useCycleTheme} from '@/hooks/useCycleTheme'
import {themeSettingAtom} from '@/state/globalState'

import {useAtomValue} from 'jotai'
import {MonitorCog, Moon, Sun} from 'lucide-react'

export function ThemeCycler() {
  const cycleTheme = useCycleTheme()
  const themeSetting = useAtomValue(themeSettingAtom)

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme}>
      {themeSetting === 'light' && <Sun className="h-6 w-[1.3rem]" />}
      {themeSetting === 'dark' && <Moon className="h-5 w-5" />}
      {themeSetting === 'system' && <MonitorCog className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
