import type {AnyFieldApi} from '@tanstack/react-form'

import {nameRegex, nameValidationMessage} from '@/shared/constants'

/**
 * TanStack Form validator for a person's-name field (first or last). The shared
 * `nameValidator` (shared/validators) is just arktype wrapping this same
 * `nameRegex`, so a single regex test is the entire check — `label`
 * ('First name' | 'Last name') only prefixes the shared message.
 */
export function nameFieldValidator(label: string) {
  return {
    onSubmit: ({value}: {value: string}) =>
      nameRegex.test(value) ? undefined : `${label} ${nameValidationMessage}`,
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
