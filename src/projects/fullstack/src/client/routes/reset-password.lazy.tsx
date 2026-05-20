import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {Button} from '@/client/components/ui/button'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {MagicCard} from '@/client/components/ui/magic-card'
import {useBoolean} from '@/client/hooks/useBoolean'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {minPasswordLength} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {
  createLazyFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {useEffect} from 'react'
import {toast} from 'sonner'

export const Route = createLazyFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

const resetPasswordErrorToastId = 'reset-password-error'
const resetPasswordErrorToast = (message: string) => {
  return toast.error(message, {id: resetPasswordErrorToastId})
}

function ResetPasswordPage() {
  const {token} = Route.useSearch()
  const {value: isTokenInvalid, setTrue: showInvalidTokenView} = useBoolean(
    !token
  )

  useEffect(() => {
    return () => {
      toast.dismiss(resetPasswordErrorToastId)
    }
  }, [])

  return isTokenInvalid ? (
    <InvalidTokenView />
  ) : (
    <NewPasswordForm
      token={token as string}
      showInvalidTokenView={showInvalidTokenView}
    />
  )
}

/**
 * User clicked the email link and now sets a new password. The token comes from
 * the URL query param added by Better Auth.
 */
function NewPasswordForm({
  token,
  showInvalidTokenView,
}: {
  token: string
  showInvalidTokenView: () => void
}) {
  const router = useRouter()
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()

  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const {error} = await authClient.resetPassword({
          newPassword: value.password,
          token,
        })

        if (error) {
          resetPasswordErrorToast('Failed to reset password')
          showInvalidTokenView()
          return
        }

        toast.success('Password reset successfully!')
        await router.navigate({to: '/signin'})
      } catch (error) {
        resetPasswordErrorToast('An unexpected error occurred')
        logClientError({
          error,
          context: 'client:resetPassword:exception',
        })
      }
    },
  })

  return (
    <div className="flex h-full justify-center overflow-auto bg-background p-4">
      <MagicCard
        className="my-auto w-full max-w-sm rounded-2xl py-6"
        spotlightGradientColor="rgba(255,255,255,.1)"
        borderGradientFrom="rgba(255,0,255,1)"
        borderGradientTo="cornflowerblue"
      >
        <CardHeader className="gap-0 pb-6 text-center">
          <CardTitle className="text-3xl">New password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={e => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <form.Field
              name="password"
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
                  <FieldLabel>Password</FieldLabel>
                  <PasswordInput
                    id="password"
                    placeholder="Password"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.errors.length > 0}
                    autoComplete="new-password"
                    minLength={minPasswordLength}
                    required
                  />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onSubmit: ({value, fieldApi}) => {
                  const pw = fieldApi.form.getFieldValue('password')
                  if (value && pw && value !== pw) {
                    return 'Passwords do not match'
                  }
                },
              }}
            >
              {field => (
                <Field>
                  <FieldLabel>Confirm password</FieldLabel>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Password"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.errors.length > 0}
                    autoComplete="new-password"
                    minLength={minPasswordLength}
                    required
                  />
                </Field>
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
                  Reset password
                </LoadingButton>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </MagicCard>
    </div>
  )
}

/**
 * Shown when the reset token is invalid or expired.
 */
function InvalidTokenView() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full justify-center overflow-auto bg-background p-4">
      <MagicCard
        className="my-auto w-full max-w-sm rounded-2xl py-6"
        spotlightGradientColor="rgba(255,255,255,.1)"
        borderGradientFrom="rgba(255,0,255,1)"
        borderGradientTo="cornflowerblue"
      >
        <CardHeader className="gap-0 pb-6 text-center">
          <CardTitle className="text-3xl">Link expired</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired. Please request a
            new one to continue resetting your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Button
              className="w-full"
              onClick={() => {
                void navigate({
                  to: '/signin',
                  search: {dialogInitialOpen: true},
                })
              }}
            >
              Request new link
            </Button>
            <p className="pt-6">
              <Link
                to="/signin"
                className="link-animated pt-6 text-primary text-sm"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </MagicCard>
    </div>
  )
}
