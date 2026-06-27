import type {AnyFieldApi} from '@tanstack/react-form'

import {validateName} from '@/shared/validators'

/**
 * TanStack Form adapter wrapping the shared `validateName` check into an
 * `{onSubmit}` validator for a person's-name field. `label` ('First name' |
 * 'Last name') prefixes the shared error message.
 */
export function nameFieldValidator(label: string) {
  return {
    onSubmit: ({value}: {value: string}) => validateName(value, label),
  }
}

/**
 * TanStack Form validator for a "confirm password" field: errors when it
 * doesn't match the sibling password field. Validates live (onChange) and on
 * submit. The `value && password` guard suppresses the error while either field
 * is still empty.
 */
export function passwordsMatchValidator<const TName extends string>(
  passwordFieldName: TName
) {
  const check = ({value, fieldApi}: {value: string; fieldApi: AnyFieldApi}) => {
    const password = fieldApi.form.getFieldValue(passwordFieldName)
    if (value && password && value !== password) {
      return 'Passwords do not match'
    }
  }

  return {
    onChangeListenTo: [passwordFieldName],
    onChange: check,
    onSubmit: check,
  }
}
