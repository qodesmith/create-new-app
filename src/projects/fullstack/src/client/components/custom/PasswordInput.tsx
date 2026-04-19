'use client'

import type {ComponentProps} from 'react'

import {Input} from '@/client/components/ui/input'
import {cn} from '@/client/lib/utils'

import {EyeIcon, EyeOffIcon} from 'lucide-react'
import {useCallback, useState} from 'react'

// Inspired from https://coss.com/origin/input
export function PasswordInput({
  id,
  label,
  labelClassName,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
  id: string
  label?: string
  labelClassName?: string
}) {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const toggleVisibility = useCallback(() => {
    setIsVisible(prevState => !prevState)
  }, [])

  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={id}
          className={cn('pe-9', className)}
          placeholder="Password"
          type={isVisible ? 'text' : 'password'}
          {...props}
        />
        <button
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={toggleVisibility}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          aria-controls={id}
        >
          {isVisible ? (
            <EyeOffIcon size={16} aria-hidden="true" />
          ) : (
            <EyeIcon size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}
