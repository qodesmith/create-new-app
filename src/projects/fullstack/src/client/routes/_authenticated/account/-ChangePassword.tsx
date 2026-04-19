import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {PasswordManagerHint} from '@/client/components/custom/PasswordManagerHint'
import {Button} from '@/client/components/ui/button'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {minPasswordLength} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ChangePassword() {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()

  const changePasswordForm = useForm({
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

      try {
        const {error} = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        })

        if (error) {
          toast.error(error.message || 'Failed to change password')
          logClientError({
            error,
            context: 'client:changePasswordRejection',
          })
          return
        }

        toast.success('Password updated successfully')
        changePasswordForm.reset()
      } catch (error) {
        toast.error('An unexpected error occurred while updating your password')
        logClientError({
          error,
          context: 'client:changePasswordException',
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
        changePasswordForm.handleSubmit()
      }}
    >
      <PasswordManagerHint />
      <changePasswordForm.Field name="currentPassword">
        {field => (
          <PasswordInput
            id="currentPassword"
            label="Current password"
            labelClassName="block pb-1 font-medium text-foreground text-sm"
            value={field.state.value}
            onChange={event => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            autoComplete="current-password"
            required
          />
        )}
      </changePasswordForm.Field>

      <changePasswordForm.Field
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
          <PasswordInput
            id="newPassword"
            label="New password"
            labelClassName="block pb-1 font-medium text-foreground text-sm"
            value={field.state.value}
            onChange={event => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            autoComplete="new-password"
            minLength={minPasswordLength}
            required
          />
        )}
      </changePasswordForm.Field>

      <changePasswordForm.Field name="confirmNewPassword">
        {field => (
          <PasswordInput
            id="confirmNewPassword"
            label="Confirm new password"
            labelClassName="block pb-1 font-medium text-foreground text-sm"
            value={field.state.value}
            onChange={event => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            autoComplete="new-password"
            minLength={minPasswordLength}
            required
          />
        )}
      </changePasswordForm.Field>

      <changePasswordForm.Subscribe>
        {({canSubmit, isSubmitting}) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </Button>
        )}
      </changePasswordForm.Subscribe>
    </form>
  )
}
