import type {CSSProperties} from 'react'
import type {ToasterProps} from 'sonner'

import {themeSelector} from '@/client/state/globalState'

import {useAtomValue} from 'jotai'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import {Toaster as Sonner} from 'sonner'

const style = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
} as CSSProperties

const icons = {
  success: <CircleCheckIcon className="size-4" />,
  info: <InfoIcon className="size-4" />,
  warning: <TriangleAlertIcon className="size-4" />,
  error: <OctagonXIcon className="size-4" />,
  loading: <Loader2Icon className="size-4 animate-spin" />,
}

export const Toaster = ({...props}: ToasterProps) => {
  const theme = useAtomValue(themeSelector)

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={style}
      icons={icons}
      {...props}
    />
  )
}
