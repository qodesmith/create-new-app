import type {FileRouteTypes} from '@/client/routeTree.gen'

import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/client/components/ui/dialog'
import {Input} from '@/client/components/ui/input'
import {useBoolean} from '@/client/hooks/useBoolean'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'

import {useForm} from '@tanstack/react-form'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

export function ResetPasswordDialog({
  dialogInitialOpen,
}: {
  dialogInitialOpen: boolean
}) {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const {value: isOpen, setValue: setIsOpen} = useBoolean(dialogInitialOpen)

  const form = useForm({
    defaultValues: {email: ''},
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const resetPasswordPath: FileRouteTypes['to'] = '/reset-password'
        const {error} = await authClient.requestPasswordReset({
          email: value.email,

          // This is the return url sent in an email to the user
          redirectTo: resetPasswordPath,
        })

        if (error) {
          toast.error('Failed to send reset email')
          logClientError({
            error,
            context: 'client:requestPasswordReset:rejection',
          })
        } else {
          toast.success('Check your email for a link to reset your password.')
        }

        setIsOpen(false)
      } catch (error) {
        toast.error('An unexpected error occurred')
        logClientError({
          error,
          context: 'client:requestPasswordReset:exception',
        })
      }
    },
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open)

        if (!open) {
          form.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <button type="button">
          <span className="link-animated text-primary">Reset it here</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Enter your email and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field name="email">
            {field => (
              <div>
                <label
                  htmlFor="reset-email"
                  className="block pb-1 font-medium text-foreground text-sm"
                >
                  Email address
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="email"
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {({canSubmit, isSubmitting}) => (
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                disabled={!canSubmit}
                className="w-full"
              >
                Send reset link
              </LoadingButton>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
