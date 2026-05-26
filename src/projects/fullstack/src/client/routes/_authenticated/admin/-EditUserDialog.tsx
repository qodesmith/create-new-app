import type {TableUser} from './-usersTableColumns'

import {Button} from '@/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {Input} from '@/client/components/ui/input'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {namePattern, nameRegex, nameValidationMessage} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useQueryClient} from '@tanstack/react-query'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

type EditUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: TableUser | null
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
}: EditUserDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update this user's first and last name. Email changes must be done
            by the user themselves.
          </DialogDescription>
        </DialogHeader>
        {/* key remounts the form when switching between users so defaultValues re-initialize */}
        <EditUserForm key={user.id} user={user} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}

type EditUserFormProps = {
  user: TableUser
  onOpenChange: (open: boolean) => void
}

function EditUserForm({user, onOpenChange}: EditUserFormProps) {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()

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
        toast.warning('Nothing to change')
        return
      }

      try {
        const {error} = await authClient.admin.updateUser({
          userId: user.id,
          data: {name, lastName},
        })

        if (error) {
          toast.error(error.message ?? 'Failed to update user')
          return
        }

        toast.success('User updated')
        await queryClient.invalidateQueries({queryKey: ['admin', 'users']})
        onOpenChange(false)
      } catch (error) {
        toast.error('An unexpected error occurred while updating the user')
        logClientError({
          error,
          context: 'client:adminUpdateUser:exception',
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
        name="name"
        validators={{
          onSubmit: ({value}) => {
            if (!nameRegex.test(value)) {
              return `First name ${nameValidationMessage}`
            }
          },
        }}
      >
        {field => (
          <Field>
            <FieldLabel htmlFor="editUserFirstName">First name</FieldLabel>
            <Input
              id="editUserFirstName"
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

      <form.Field
        name="lastName"
        validators={{
          onSubmit: ({value}) => {
            if (!nameRegex.test(value)) {
              return `Last name ${nameValidationMessage}`
            }
          },
        }}
      >
        {field => (
          <Field>
            <FieldLabel htmlFor="editUserLastName">Last name</FieldLabel>
            <Input
              id="editUserLastName"
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

      <DialogFooter>
        <form.Subscribe>
          {({canSubmit, isSubmitting}) => (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  )
}
