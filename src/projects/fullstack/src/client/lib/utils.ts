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
 * Helper for the onSubmitInvalid handler in useForm. Renders a single error
 * toast summarizing the form's validation errors: the message itself when
 * there's only one, or a count when there are multiple.
 */
export const handleFormSubmitInvalid = ({formApi}: {formApi: AnyFormApi}) => {
  const messages = Object.values(formApi.getAllErrors().fields)
    .flatMap(field => field.errors)
    .filter((error): error is string => typeof error === 'string')

  if (messages.length === 0) return

  if (messages.length === 1) {
    toast.error(messages[0])
    return
  }

  toast.error(`Please fix ${messages.length} errors in the form`)
}
