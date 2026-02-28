import type {FileRouteTypes} from '@/client/routeTree.gen'

import {Button} from '@/client/components/ui/button'
import {Input} from '@/client/components/ui/input'
import {Label} from '@/client/components/ui/label'
import {handleFormSubmitInvalid, logClientError} from '@/client/lib/utils'
import {apiClientAtom, authClientAtom} from '@/client/state/globalState'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ChangeEmail() {
  const authClient = useAtomValue(authClientAtom)
  const apiClient = useAtomValue(apiClientAtom)

  const changeEmailForm = useForm({
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
        const callbackURL: FileRouteTypes['to'] = '/account'
        const {error} = await authClient.changeEmail({
          newEmail: email.trim(),
          callbackURL,
        })

        if (error) {
          toast.error(error.message || 'Failed to change email')
          logClientError({
            error,
            context: 'client:changeEmailFailure',
            apiClient,
          })
          return
        }

        changeEmailForm.reset()
        toast.success(
          'We sent a verification link to your current email. Please confirm the change.'
        )
      } catch (error) {
        toast.error('An unexpected error occurred while updating your email')
        logClientError({error, context: 'client:changeEmailError', apiClient})
      }
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()
        changeEmailForm.handleSubmit()
      }}
    >
      <changeEmailForm.Field
        name="email"
        validators={{
          onSubmit: ({value}) => {
            if (!value.trim()) return 'Email is required'
          },
        }}
      >
        {field => (
          <div className="space-y-1 text-sm">
            <Label htmlFor="newEmail">New email</Label>
            <Input
              id="newEmail"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              required
            />
          </div>
        )}
      </changeEmailForm.Field>

      <changeEmailForm.Field name="confirmEmail">
        {field => (
          <div className="space-y-1 text-sm">
            <Label htmlFor="confirmEmail">Confirm new email</Label>
            <Input
              id="confirmEmail"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              required
            />
          </div>
        )}
      </changeEmailForm.Field>

      <changeEmailForm.Subscribe>
        {({canSubmit, isSubmitting}) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Sending verification...' : 'Update email'}
          </Button>
        )}
      </changeEmailForm.Subscribe>
    </form>
  )
}
