import type {FileRouteTypes} from '@/client/routeTree.gen'

import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {PasswordManagerHint} from '@/client/components/custom/PasswordManagerHint'
import {Button} from '@/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import {useBoolean} from '@/client/hooks/useBoolean'
import {handleFormSubmitInvalid, logClientError} from '@/client/lib/utils'
import {apiClientAtom, authClientAtom} from '@/client/state/globalState'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function DeleteAccount() {
  const authClient = useAtomValue(authClientAtom)
  const apiClient = useAtomValue(apiClientAtom)
  const deleteDialog = useBoolean()

  const form = useForm({
    defaultValues: {password: ''},
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const callbackURL: FileRouteTypes['to'] = '/signup'
        const {error} = await authClient.deleteUser({
          callbackURL,
          password: value.password,
        })

        if (error) {
          toast.error(error.message || 'Failed to request account deletion')
          logClientError({
            error,
            context: 'client:deleteAccountRejection',
            apiClient,
          })
          return
        }

        deleteDialog.setFalse()
        form.reset()
        toast.success('Check your email to confirm account deletion')
      } catch (error) {
        toast.error('An unexpected error occurred while deleting your account')
        logClientError({
          error,
          context: 'client:deleteAccountException',
          apiClient,
        })
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
            <PasswordManagerHint />
            <form.Field name="password">
              {field => (
                <PasswordInput
                  id="deleteAccountPassword"
                  label="Password"
                  labelClassName="block pb-1 font-medium text-foreground text-sm"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="current-password"
                  required
                />
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
