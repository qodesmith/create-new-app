import type {ComponentProps} from 'react'

import {AudioLoader} from '@/components/custom/AudioLoader'
import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

type LoadingButtonProps = Omit<ComponentProps<typeof Button>, 'children'> &
  ComponentProps<typeof AudioLoader> & {
    text: string
    loading?: boolean
  }

export function LoadingButton({
  text,
  loading,
  width = 20,
  height = 20,
  gap = 1,
  bars,
  rounded = 2,
  speed,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      <span className={cn('absolute', loading ? 'inline-block' : 'hidden')}>
        <AudioLoader
          width={width}
          height={height}
          gap={gap}
          bars={bars}
          rounded={rounded}
          speed={speed}
        />
      </span>
      <span className={cn(loading && 'invisible')}>{text}</span>
    </Button>
  )
}
