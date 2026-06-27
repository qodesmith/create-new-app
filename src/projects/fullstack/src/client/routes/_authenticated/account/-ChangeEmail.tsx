import {Button} from '@/client/components/ui/button'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {Input} from '@/client/components/ui/input'
import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {changeEmailCallbackRoutes} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ChangeEmail() {
  const authClient = useAtomValue(authClientAtom)

  const {run} = useMutationWithToast(
    /**
     * We've implemented Better Auth's change email functionality with a two
     * step process:
     *
     * 1. CONFIRM the INTENT to change an email
     * 2. VERIFY the ACTION to change an email
     *
     * `authClient.changeEmail` only takes in a single callbackURL which Better
     * Auth uses for BOTH steps. We override the 2nd step callbackURL in auth.ts
     * where these two steps are defined.
     */
    (newEmail: string) =>
      authClient.changeEmail({
        newEmail,
        callbackURL: changeEmailCallbackRoutes.step1,
      }),
    {
      success:
        'We sent a verification link to your current email. Please confirm the change.',
      context: 'client:changeEmail:exception',
      errorFallback: 'Failed to change email',
      errorMessage: 'safe',
      exception: 'An unexpected error occurred while updating your email',
    }
  )

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

      if (await run(email.trim())) form.reset()
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
