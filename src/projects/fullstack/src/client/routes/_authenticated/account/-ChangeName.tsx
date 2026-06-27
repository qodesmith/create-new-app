import {Button} from '@/client/components/ui/button'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {Input} from '@/client/components/ui/input'
import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {nameFieldValidator} from '@/client/lib/formValidators'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {namePattern} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useRouteContext, useRouter} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ChangeName() {
  const authClient = useAtomValue(authClientAtom)
  const router = useRouter()
  const user = useRouteContext({
    from: '/_authenticated',
    select: ({user}) => user,
  })

  const {run} = useMutationWithToast(
    (input: {name: string; lastName: string}) => authClient.updateUser(input),
    {
      success: 'Name updated successfully',
      context: 'client:changeName:exception',
      errorFallback: 'Failed to update name',
      errorMessage: 'safe',
      exception: 'An unexpected error occurred while updating your name',
      onSuccess: () => router.invalidate(),
    }
  )

  const form = useForm({
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      const name = value.name.trim()
      const lastName = value.lastName.trim()

      if (name === user.name && lastName === user.lastName) {
        toast.warning('Same name, nothing to change')
        return
      }

      await run({name, lastName})
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
      <form.Field name="name" validators={nameFieldValidator('First name')}>
        {field => (
          <Field>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input
              id="firstName"
              type="text"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              pattern={namePattern}
              aria-invalid={field.state.meta.errors.length > 0}
              required
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="lastName" validators={nameFieldValidator('Last name')}>
        {field => (
          <Field>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input
              id="lastName"
              type="text"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              pattern={namePattern}
              aria-invalid={field.state.meta.errors.length > 0}
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
            {isSubmitting ? 'Updating name...' : 'Update name'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
