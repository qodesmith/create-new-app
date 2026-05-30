import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {PasswordManagerHint} from '@/client/components/custom/PasswordManagerHint'
import {Button} from '@/client/components/ui/button'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {
  getSafeAuthErrorMessage,
  handleFormSubmitInvalid,
} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {minPasswordLength} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ChangePassword() {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value, formApi}) => {
      const {currentPassword, newPassword, confirmNewPassword} = value

      if (newPassword !== confirmNewPassword) {
        toast.error('New passwords must match')
        formApi.setFieldValue('confirmNewPassword', '')
        return
      }

      if (currentPassword === newPassword) {
        toast.warning('Same password, nothing to change')
        return
      }

      try {
        const {error} = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        })

        if (error) {
          toast.error(
            getSafeAuthErrorMessage(error, 'Failed to change password')
          )
          return
        }

        toast.success('Password updated successfully')
        form.reset()
      } catch (error) {
        toast.error('An unexpected error occurred while updating your password')
        logClientError({
          error,
          context: 'client:changePassword:exception',
        })
      }
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
    >
      <PasswordManagerHint />
      <form.Field name="currentPassword">
        {field => (
          <Field>
            <FieldLabel>Current password</FieldLabel>
            <PasswordInput
              id="currentPassword"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              autoComplete="current-password"
              required
            />
          </Field>
        )}
      </form.Field>

      <form.Field
        name="newPassword"
        validators={{
          onSubmit: ({value}) => {
            if (value.length < minPasswordLength) {
              return `Password must be at least ${minPasswordLength} characters`
            }
          },
        }}
      >
        {field => (
          <Field>
            <FieldLabel>New password</FieldLabel>
            <PasswordInput
              id="newPassword"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              autoComplete="new-password"
              minLength={minPasswordLength}
              required
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="confirmNewPassword">
        {field => (
          <Field>
            <FieldLabel>Confirm new password</FieldLabel>
            <PasswordInput
              id="confirmNewPassword"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              autoComplete="new-password"
              minLength={minPasswordLength}
              required
            />
          </Field>
        )}
      </form.Field>

      <form.Subscribe>
        {({canSubmit, isSubmitting}) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
