import {Button} from '@/client/components/ui/button'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {Input} from '@/client/components/ui/input'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {
  getSafeAuthErrorMessage,
  handleFormSubmitInvalid,
} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {changeEmailCallbackRoutes} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ChangeEmail() {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()

  const form = useForm({
    defaultValues: {
      email: '',
      confirmEmail: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      const {email, confirmEmail} = value

      if (email.trim() !== confirmEmail.trim()) {
        toast.error('Email addresses must match')
        return
      }

      try {
        /**
         * We've implemented Better Auth's change email functionality with a two
         * step process:
         *
         * 1. CONFIRM the INTENT to change an email
         * 2. VERIFY the ACTION to change an email
         *
         * `authClient.changeEmail` only takes in a single callbackURL which
         * Better Auth uses for BOTH steps. We override the 2nd step callbackURL
         * in auth.ts where these two steps are defined.
         */
        const {error} = await authClient.changeEmail({
          newEmail: email.trim(),
          callbackURL: changeEmailCallbackRoutes.step1,
        })

        if (error) {
          toast.error(getSafeAuthErrorMessage(error, 'Failed to change email'))
          return
        }

        form.reset()
        toast.success(
          'We sent a verification link to your current email. Please confirm the change.'
        )
      } catch (error) {
        toast.error('An unexpected error occurred while updating your email')
        logClientError({
          error,
          context: 'client:changeEmail:exception',
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
      <form.Field
        name="email"
        validators={{
          onSubmit: ({value}) => {
            if (!value.trim()) return 'Email is required'
          },
        }}
      >
        {field => (
          <Field>
            <FieldLabel htmlFor="newEmail">New email</FieldLabel>
            <Input
              id="newEmail"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              required
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="confirmEmail">
        {field => (
          <Field>
            <FieldLabel htmlFor="confirmEmail">Confirm new email</FieldLabel>
            <Input
              id="confirmEmail"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
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
            {isSubmitting ? 'Sending verification...' : 'Update email'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
