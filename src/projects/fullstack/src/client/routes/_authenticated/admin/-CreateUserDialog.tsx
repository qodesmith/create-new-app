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
import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {nameFieldValidator} from '@/client/lib/formValidators'
import {
  generateStrongPassword,
  handleFormSubmitInvalid,
} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {minPasswordLength, namePattern, userRoles} from '@/shared/constants'
import {emailValidator} from '@/shared/validators'

import {useForm} from '@tanstack/react-form'
import {type} from 'arktype'
import {useAtomValue} from 'jotai'
import {CheckIcon, CopyIcon} from 'lucide-react'
import {useCallback, useState} from 'react'
import {toast} from 'sonner'

const userRoleOptions = Object.values(userRoles)
type UserRoleOption = (typeof userRoleOptions)[number]

type CreateUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({open, onOpenChange}: CreateUserDialogProps) {
  const authClient = useAtomValue(authClientAtom)
  const [hasGeneratedPassword, setHasGeneratedPassword] =
    useState<boolean>(false)
  const [didCopy, setDidCopy] = useState<boolean>(false)

  const {run} = useMutationWithToast(
    (value: {
      email: string
      password: string
      name: string
      lastName: string
      role: UserRoleOption
    }) =>
      authClient.admin.createUser({
        email: value.email,
        password: value.password,
        name: value.name,
        role: value.role,
        data: {lastName: value.lastName},
      }),
    {
      invalidate: ['admin', 'users'],
      context: 'client:adminCreateUser:exception',
      errorFallback: 'Failed to create user',
      exception: 'An unexpected error occurred while creating the user',
    }
  )

  const form = useForm({
    defaultValues: {
      email: '',
      name: '',
      lastName: '',
      password: '',
      role: userRoles.user as UserRoleOption,
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      // Success toast is interpolated with the submitted email, so it lives here
      // (driven by run's return value) rather than in the hook's static config.
      const created = await run(value)
      if (!created) return

      toast.success(`User ${value.email} created`)
      form.reset()
      setHasGeneratedPassword(false)
      setDidCopy(false)
      onOpenChange(false)
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
              validators={nameFieldValidator('First name')}
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
              validators={nameFieldValidator('Last name')}
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
