import type {ComponentProps} from 'react'

import {AudioLoader} from '@/components/custom/AudioLoader'
import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

type LoadingButtonProps = ComponentProps<typeof Button> &
  ComponentProps<typeof AudioLoader> & {loading?: boolean}

export function LoadingButton({
  loading,
  width = 20,
  height = 20,
  gap = 1,
  bars,
  rounded = 2,
  speed,
  disabled,
  children,
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
      <span className={cn(loading && 'invisible')}>{children}</span>
    </Button>
  )
}
