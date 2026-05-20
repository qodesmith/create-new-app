import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {Input} from '@/client/components/ui/input'
import {MagicCard} from '@/client/components/ui/magic-card'
import {defaultAuthedPath} from '@/client/constants'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {
  minPasswordLength,
  namePattern,
  nameRegex,
  nameValidationMessage,
} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {createLazyFileRoute, Link, useRouter} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {useEffect} from 'react'
import {toast} from 'sonner'

export const Route = createLazyFileRoute('/signup')({
  component: SignUpPage,
})

const signupErrorToastId = 'signup-error'
const signupErrorToast = (message: string) => {
  return toast.error(message, {id: signupErrorToastId})
}

function SignUpPage() {
  const router = useRouter()
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()

  const form = useForm({
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const {error} = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
          lastName: value.lastName,
          callbackURL: defaultAuthedPath,
        })

        if (error) {
          signupErrorToast('Failed to sign up')
          return
        }

        toast.success('Account created successfully! Please check your email.')
        await router.navigate({to: '/signin'})
      } catch (error) {
        signupErrorToast('An unexpected error occurred')
        logClientError({error, context: 'client:signUp:exception'})
      }
    },
  })

  useEffect(() => {
    return () => {
      toast.dismiss(signupErrorToastId)
    }
  }, [])

  return (
    <div className="flex h-full justify-center overflow-auto bg-background p-4">
      <MagicCard
        className="my-auto w-full max-w-sm rounded-2xl py-6"
        spotlightGradientColor="rgba(255,255,255,.1)"
        borderGradientFrom="rgba(255,0,255,1)"
        borderGradientTo="cornflowerblue"
      >
        <CardHeader className="gap-0 pb-6 text-center">
          <CardTitle className="text-3xl">Create an account</CardTitle>
          <CardDescription>Join us and get started</CardDescription>
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
            {/* NAME */}
            <div className="flex gap-3">
              {/* FIRST NAME */}
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
                  <div>
                    <label
                      htmlFor="name"
                      className="block pb-1 font-medium text-foreground text-sm"
                    >
                      First name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      pattern={namePattern}
                      aria-invalid={field.state.meta.errors.length > 0}
                      autoFocus
                    />
                  </div>
                )}
              </form.Field>

              {/* LAST NAME */}
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
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block pb-1 font-medium text-foreground text-sm"
                    >
                      Last name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      pattern={namePattern}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            {/* EMAIL */}
            <form.Field
              name="email"
              validators={{
                onSubmit: ({value}) => {
                  if (!value) {
                    return 'Email is required'
                  }
                },
              }}
            >
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
                    placeholder="johndoe@example.com"
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

            {/* PASSWORD */}
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

            {/* CONFIRM PASSWORD */}
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
                  Create account
                </LoadingButton>
              )}
            </form.Subscribe>
          </form>

          <div className="pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link to="/signin" className="link-animated text-primary">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </MagicCard>
    </div>
  )
}
