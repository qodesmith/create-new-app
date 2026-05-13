import type {User} from '@/client/types'

import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {Input} from '@/client/components/ui/input'
import {MagicCard} from '@/client/components/ui/magic-card'
import {Separator} from '@/client/components/ui/separator'
import {defaultAuthedPath} from '@/client/constants'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {isValidRoute} from '@/client/lib/isValidRoute'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {ResetPasswordDialog} from '@/client/routes/signin/-ResetPasswordDialog'
import {authClientAtom, userAtom} from '@/client/state/globalState'
import {minPasswordLength} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {createLazyFileRoute, Link, useRouter} from '@tanstack/react-router'
import {useAtomValue, useSetAtom} from 'jotai'
import {Fingerprint} from 'lucide-react'
import {useState} from 'react'
import {toast} from 'sonner'

export const Route = createLazyFileRoute('/signin')({
  component: SignInPage,
})

function SignInPage() {
  const router = useRouter()
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const setUser = useSetAtom(userAtom)
  const {redirect, dialogInitialOpen} = Route.useSearch()
  const redirectPath = isValidRoute(router, redirect)
    ? redirect
    : defaultAuthedPath
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)

  const handlePasskeySignIn = async () => {
    setIsPasskeyLoading(true)

    try {
      const result = await authClient.signIn.passkey()

      if (result?.error) {
        toast.error('Failed to sign in with passkey')
        return
      }

      setUser(result.data.user as User)
      await router.navigate({to: redirectPath})
    } catch (error) {
      const isWebAuthnCancellation =
        error instanceof DOMException && error.name === 'NotAllowedError'
      if (isWebAuthnCancellation) return

      toast.error('Failed to sign in with passkey')
      logClientError({
        error,
        context: 'client:passkeySignIn:exception',
      })
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        })

        if (result.error) {
          toast.error('Failed to sign in')
          return
        }

        setUser(result.data.user)
        await router.navigate({to: redirectPath})
      } catch (error) {
        toast.error('An unexpected error occurred')
        logClientError({
          error,
          context: 'client:signIn:exception',
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
          <CardTitle className="text-3xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
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
            <form.Field name="email">
              {field => (
                <div>
                  <label
                    htmlFor="email"
                    className="block pb-1 font-medium text-foreground text-sm"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
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
                <PasswordInput
                  id="password"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="current-password"
                  minLength={minPasswordLength}
                  required
                  label="Password"
                  labelClassName="block pb-1 font-medium text-foreground text-sm"
                />
              )}
            </form.Field>

            <form.Subscribe>
              {({canSubmit, isSubmitting}) => (
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={!canSubmit || isPasskeyLoading}
                  className="w-full"
                >
                  Sign in
                </LoadingButton>
              )}
            </form.Subscribe>
          </form>

          <div className="relative flex items-center py-6">
            <Separator className="w-auto! grow" />
            <div className="px-2 text-muted-foreground text-xs">or</div>
            <Separator className="w-auto! grow" />
          </div>

          <LoadingButton
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePasskeySignIn}
            loading={form.state.isSubmitting}
            disabled={isPasskeyLoading}
          >
            <span className="flex items-center gap-2">
              <Fingerprint className="size-4" />
              Sign in with passkey
            </span>
          </LoadingButton>

          <div className="pt-6 text-center text-muted-foreground text-sm">
            <p>
              Forgot your password?{' '}
              <ResetPasswordDialog dialogInitialOpen={!!dialogInitialOpen} />
            </p>
            <p>
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-foreground transition-colors hover:text-muted-foreground"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </MagicCard>
    </div>
  )
}
