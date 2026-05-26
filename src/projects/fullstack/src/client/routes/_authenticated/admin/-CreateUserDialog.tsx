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
import {Input} from '@/client/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {
  minPasswordLength,
  namePattern,
  nameRegex,
  nameValidationMessage,
} from '@/shared/constants'
import {emailValidator, nameValidator} from '@/shared/validators'

import {useForm} from '@tanstack/react-form'
import {useQueryClient} from '@tanstack/react-query'
import {type} from 'arktype'
import {useAtomValue} from 'jotai'
import {CheckIcon, CopyIcon} from 'lucide-react'
import {useCallback, useState} from 'react'
import {toast} from 'sonner'

// Mirrors `userRoles` in `src/server/constants.ts` (kept inline to avoid server imports).
const userRoleOptions = ['user', 'admin'] as const
type UserRoleOption = (typeof userRoleOptions)[number]

const passwordCharset =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
const generatedPasswordLength = 16

function generateStrongPassword(): string {
  const bytes = window.crypto.getRandomValues(
    new Uint8Array(generatedPasswordLength)
  )
  let out = ''
  for (const byte of bytes) {
    out += passwordCharset[byte % passwordCharset.length]
  }
  return out
}

type CreateUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({open, onOpenChange}: CreateUserDialogProps) {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()
  const [hasGeneratedPassword, setHasGeneratedPassword] =
    useState<boolean>(false)
  const [didCopy, setDidCopy] = useState<boolean>(false)

  const form = useForm({
    defaultValues: {
      email: '',
      name: '',
      lastName: '',
      password: '',
      role: 'user' as UserRoleOption,
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const {error} = await authClient.admin.createUser({
          email: value.email,
          password: value.password,
          name: value.name,
          role: value.role,
          data: {lastName: value.lastName},
        })

        if (error) {
          toast.error(error.message ?? 'Failed to create user')
          return
        }

        toast.success(`User ${value.email} created`)
        await queryClient.invalidateQueries({queryKey: ['admin', 'users']})
        form.reset()
        setHasGeneratedPassword(false)
        setDidCopy(false)
        onOpenChange(false)
      } catch (error) {
        toast.error('An unexpected error occurred while creating the user')
        logClientError({
          error,
          context: 'client:adminCreateUser:exception',
        })
      }
    },
  })

  const handleGenerate = useCallback(() => {
    const next = generateStrongPassword()
    form.setFieldValue('password', next)
    setHasGeneratedPassword(true)
    setDidCopy(false)
  }, [form])

  const handleCopy = useCallback(async () => {
    const current = form.getFieldValue('password')
    if (!current) return
    try {
      await navigator.clipboard.writeText(current)
      setDidCopy(true)
      toast.success('Password copied to clipboard')
      setTimeout(() => setDidCopy(false), 2000)
    } catch {
      toast.error('Failed to copy password')
    }
  }, [form])

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) {
          form.reset()
          setHasGeneratedPassword(false)
          setDidCopy(false)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Add a new user. They will be created without an email verification
            step.
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
          <form.Field
            name="email"
            validators={{
              onSubmit: ({value}) => {
                const result = emailValidator(value)
                if (result instanceof type.errors) {
                  return 'Invalid email'
                }
              },
            }}
          >
            {field => (
              <Field>
                <FieldLabel htmlFor="createUserEmail">Email</FieldLabel>
                <Input
                  id="createUserEmail"
                  type="email"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="off"
                  required
                />
              </Field>
            )}
          </form.Field>

          <div className="flex gap-3">
            <form.Field
              name="name"
              validators={{
                onSubmit: ({value}) => {
                  if (!nameRegex.test(value)) {
                    return `First name ${nameValidationMessage}`
                  }
                  const result = nameValidator(value)
                  if (result instanceof type.errors) {
                    return `First name ${nameValidationMessage}`
                  }
                },
              }}
            >
              {field => (
                <Field>
                  <FieldLabel htmlFor="createUserFirstName">
                    First name
                  </FieldLabel>
                  <Input
                    id="createUserFirstName"
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
                  const result = nameValidator(value)
                  if (result instanceof type.errors) {
                    return `Last name ${nameValidationMessage}`
                  }
                },
              }}
            >
              {field => (
                <Field>
                  <FieldLabel htmlFor="createUserLastName">
                    Last name
                  </FieldLabel>
                  <Input
                    id="createUserLastName"
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
          </div>

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
                <FieldLabel htmlFor="createUserPassword">Password</FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PasswordInput
                      id="createUserPassword"
                      value={field.state.value}
                      onChange={event => {
                        field.handleChange(event.target.value)
                        setHasGeneratedPassword(false)
                        setDidCopy(false)
                      }}
                      onBlur={field.handleBlur}
                      autoComplete="new-password"
                      minLength={minPasswordLength}
                      isInvalid={field.state.meta.errors.length > 0}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                  >
                    Generate
                  </Button>
                  {hasGeneratedPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      aria-label="Copy generated password to clipboard"
                    >
                      {didCopy ? (
                        <CheckIcon className="size-4" />
                      ) : (
                        <CopyIcon className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              </Field>
            )}
          </form.Field>

          <form.Field name="role">
            {field => (
              <Field>
                <FieldLabel htmlFor="createUserRole">Role</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={value =>
                    field.handleChange(value as UserRoleOption)
                  }
                >
                  <SelectTrigger id="createUserRole" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoleOptions.map(role => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {isSubmitting ? 'Creating...' : 'Create user'}
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
