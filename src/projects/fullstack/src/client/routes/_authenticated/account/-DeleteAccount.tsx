import type {FileRouteTypes} from '@/client/routeTree.gen'

import {PasswordInput} from '@/client/components/custom/PasswordInput'
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
import {useBoolean} from '@/client/hooks/useBoolean'
import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'

export function DeleteAccount() {
  const authClient = useAtomValue(authClientAtom)
  const deleteDialog = useBoolean()

  const {run} = useMutationWithToast(
    (password: string) => {
      const callbackURL: FileRouteTypes['to'] = '/signup'
      return authClient.deleteUser({callbackURL, password})
    },
    {
      success: 'Check your email to confirm account deletion',
      context: 'client:deleteAccount:exception',
      // Static: deliberately never surface the server message — it could leak
      // why the deletion request was rejected.
      errorFallback: 'Failed to request account deletion',
      errorMessage: 'static',
      exception: 'An unexpected error occurred while deleting your account',
    }
  )

  const form = useForm({
    defaultValues: {password: ''},
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      if (await run(value.password)) {
        deleteDialog.setFalse()
        form.reset()
      }
    },
  })

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Permanently delete your account and all associated data. This action
        cannot be undone.
      </p>
      <Button variant="destructive" onClick={deleteDialog.setTrue}>
        Delete account
      </Button>

      <Dialog
        open={deleteDialog.value}
        onOpenChange={open => {
          if (!open) {
            deleteDialog.setFalse()
            form.reset()
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account. Enter your password to
              confirm. We'll send a verification email before completing the
              deletion.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault()
              event.stopPropagation()
              form.handleSubmit()
            }}
          >
            <form.Field name="password">
              {field => (
                <Field>
                  <FieldLabel htmlFor="deleteAccount">Password</FieldLabel>
                  <PasswordInput
                    id="deleteAccount"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    typeOverride="text"
                    placeholder="Type your pw here"
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
                      onClick={() => {
                        deleteDialog.setFalse()
                        form.reset()
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? 'Deleting...' : 'Delete account'}
                    </Button>
                  </>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
