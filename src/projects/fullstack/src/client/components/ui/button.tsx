import type {VariantProps} from 'class-variance-authority'
import type * as React from 'react'

import {cn} from '@/client/lib/utils'

import {Slot} from 'radix-ui'

import {buttonVariants} from './button.variants'

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({variant, size, className}))}
      {...props}
    />
  )
}

export {Button}
