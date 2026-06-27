import type {User} from '@/client/types'

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
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {passwordsMatchValidator} from '@/client/lib/formValidators'
import {
  generateStrongPassword,
  handleFormSubmitInvalid,
} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'
import {minPasswordLength} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {useQueryClient} from '@tanstack/react-query'
import {useAtomValue} from 'jotai'
import {CheckIcon, CopyIcon} from 'lucide-react'
import {useCallback, useState} from 'react'
import {toast} from 'sonner'

type SetPasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function SetPasswordDialog({
  open,
  onOpenChange,
  user,
}: SetPasswordDialogProps) {
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [savedAcknowledged, setSavedAcknowledged] = useState<boolean>(false)

  if (!user) return null

  const closeLocked = submitted && !savedAcknowledged

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && closeLocked) return
        if (!nextOpen) {
          setSubmitted(false)
          setSavedAcknowledged(false)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={event => {
          if (closeLocked) event.preventDefault()
        }}
        onPointerDownOutside={event => {
          if (closeLocked) event.preventDefault()
        }}
        onInteractOutside={event => {
          if (closeLocked) event.preventDefault()
        }}
        showCloseButton={!closeLocked}
      >
        <DialogHeader>
          <DialogTitle>Set password for {user.email}</DialogTitle>
          <DialogDescription>
            Directly set a new password for this user. Use this only as a manual
            recovery path.
          </DialogDescription>
        </DialogHeader>
        <SetPasswordForm
          key={user.id}
          user={user}
          submitted={submitted}
          savedAcknowledged={savedAcknowledged}
          onSubmitted={() => setSubmitted(true)}
          onAcknowledgeChange={setSavedAcknowledged}
          onRequestClose={() => {
            if (closeLocked) return
            setSubmitted(false)
            setSavedAcknowledged(false)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

type SetPasswordFormProps = {
  user: User
  submitted: boolean
  savedAcknowledged: boolean
  onSubmitted: () => void
  onAcknowledgeChange: (value: boolean) => void
  onRequestClose: () => void
}

function SetPasswordForm({
  user,
  submitted,
  savedAcknowledged,
  onSubmitted,
  onAcknowledgeChange,
  onRequestClose,
}: SetPasswordFormProps) {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()
  const [hasGeneratedPassword, setHasGeneratedPassword] =
    useState<boolean>(false)
  const [didCopy, setDidCopy] = useState<boolean>(false)

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      revokeSessions: true,
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      try {
        const {error} = await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword: value.newPassword,
        })

        if (error) {
          toast.error(error.message ?? 'Failed to set password')
          return
        }

        if (value.revokeSessions) {
          const {error: revokeError} =
            await authClient.admin.revokeUserSessions({userId: user.id})

          if (revokeError) {
            toast.error('Password updated, but failed to revoke sessions')
          }
        }

        toast.success('Password updated')

        await Promise.all([
          queryClient.invalidateQueries({queryKey: ['admin', 'users']}),
          queryClient.invalidateQueries({
            queryKey: ['admin', 'users', user.id, 'sessions'],
          }),
        ])

        onSubmitted()
      } catch (error) {
        logClientError({
          error,
          context: 'client:adminSetUserPassword:exception',
        })
        toast.error('An unexpected error occurred while setting the password')
      }
    },
  })

  const handleGenerate = useCallback(() => {
    const next = generateStrongPassword()
    form.setFieldValue('newPassword', next)
    form.setFieldValue('confirmPassword', next)
    setHasGeneratedPassword(true)
    setDidCopy(false)
  }, [form])

  const handleCopy = useCallback(async () => {
    const current = form.getFieldValue('newPassword')
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
    <form
      className="space-y-4"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()
        if (submitted) return
        form.handleSubmit()
      }}
    >
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
        Share this password with the user via a secure channel — it will not be
        shown again. If you don't sign them out of existing devices, anyone with
        their current session can continue using the account.
      </div>

      <form.Field
        name="newPassword"
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
            <FieldLabel htmlFor="setPasswordNewPassword">
              New password
            </FieldLabel>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <PasswordInput
                  id="setPasswordNewPassword"
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
                  disabled={submitted}
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={submitted}
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

      <form.Field
        name="confirmPassword"
        validators={passwordsMatchValidator('newPassword')}
      >
        {field => (
          <Field>
            <FieldLabel htmlFor="setPasswordConfirmPassword">
              Confirm password
            </FieldLabel>
            <PasswordInput
              id="setPasswordConfirmPassword"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              autoComplete="new-password"
              minLength={minPasswordLength}
              isInvalid={field.state.meta.errors.length > 0}
              disabled={submitted}
              required
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-destructive text-sm">
                {field.state.meta.errors[0] as string}
              </p>
            ) : null}
          </Field>
        )}
      </form.Field>

      <form.Field name="revokeSessions">
        {field => (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={field.state.value}
              onChange={event => field.handleChange(event.target.checked)}
              disabled={submitted}
            />
            <span>Also sign user out of all devices</span>
          </label>
        )}
      </form.Field>

      {submitted ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            checked={savedAcknowledged}
            onChange={event => onAcknowledgeChange(event.target.checked)}
          />
          <span>I've saved this password</span>
        </label>
      ) : null}

      <DialogFooter>
        {submitted ? (
          <Button
            type="button"
            onClick={onRequestClose}
            disabled={!savedAcknowledged}
          >
            Close
          </Button>
        ) : (
          <form.Subscribe
            selector={state => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
              newPassword: state.values.newPassword,
              confirmPassword: state.values.confirmPassword,
            })}
          >
            {({canSubmit, isSubmitting, newPassword, confirmPassword}) => {
              const passwordsMatch =
                newPassword.length >= minPasswordLength &&
                newPassword === confirmPassword
              return (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onRequestClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting || !passwordsMatch}
                  >
                    {isSubmitting ? 'Setting...' : 'Set password'}
                  </Button>
                </>
              )
            }}
          </form.Subscribe>
        )}
      </DialogFooter>
    </form>
  )
}
