import type {AnyFormApi} from '@tanstack/react-form'
import type {ClassValue} from 'clsx'

import {clsx} from 'clsx'
import {toast} from 'sonner'
import {twMerge} from 'tailwind-merge'

/**
 * Uses clsx and twMerge to handle classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Helper to automatically create an error toast for all errors found on a
 * Tanstack form in the onSubmitInvalid handler in useForm.
 */
export const handleFormSubmitInvalid = ({formApi}: {formApi: AnyFormApi}) => {
  Object.values(formApi.getAllErrors().fields).forEach(field => {
    field.errors.forEach(errorMessage => {
      if (typeof errorMessage === 'string') {
        toast.error(errorMessage)
      }
    })
  })
}
