import type {ReactNode} from 'react'
import type {FileRouteTypes} from '@/client/routeTree.gen'

import {PasswordInput} from '@/client/components/custom/PasswordInput'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {BorderBeam} from '@/client/components/ui/border-beam'
import {Button} from '@/client/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import {Input} from '@/client/components/ui/input'
import {Label} from '@/client/components/ui/label'
import {Separator} from '@/client/components/ui/separator'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {
  authClientAtom,
  themeSelector,
  themeSettingAtom,
} from '@/client/state/globalState'
import {minPasswordLength} from '@/shared/constants'

import {useForm} from '@tanstack/react-form'
import {createLazyFileRoute, useRouteContext} from '@tanstack/react-router'
import {useAtom, useAtomValue} from 'jotai'
import {useId, useMemo, useState} from 'react'
import {toast} from 'sonner'

export const Route = createLazyFileRoute('/_authenticated/account')({
  component: AccountPage,
})

function AccountPage() {
  const user = useRouteContext({
    from: '/_authenticated',
    select: ({user}) => user,
  })
  const initials = useMemo(() => {
    const first = user.name.trim()[0] ?? ''
    const last = user.lastName?.trim?.()[0] ?? ''
    return `${first}${last}` || (user.name || 'U').slice(0, 2)
  }, [user.lastName, user.name])
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  )
  const avatarInputId = useId()
  const [themeSetting, setThemeSetting] = useAtom(themeSettingAtom)
  const theme = useAtomValue(themeSelector)
  const authClient = useAtomValue(authClientAtom)

  const changeEmailForm = useForm({
    defaultValues: {
      email: '',
      confirmEmail: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      const {email, confirmEmail} = value

      if (email.trim() !== confirmEmail.trim()) {
        toast.error('Email addresses must match')
        return
      }

      try {
        const callbackURL: FileRouteTypes['to'] = '/account'
        const result = await authClient.changeEmail({
          newEmail: email.trim(),
          callbackURL,
        })

        if (result.error) {
          toast.error(result.error.message || 'Failed to start email change')
          return
        }

        changeEmailForm.reset()
        toast.success(
          'We sent a verification link to your current email. Pleas confirm the change.'
        )
      } catch {
        toast.error('An unexpected error occurred while updating your email')
      }
    },
  })

  const changePasswordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value, formApi}) => {
      const {currentPassword, newPassword, confirmNewPassword} = value

      if (newPassword !== confirmNewPassword) {
        toast.error('New passwords must match')
        formApi.setFieldValue('confirmNewPassword', '')
        return
      }

      try {
        const result = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        })

        if (result.error) {
          toast.error(result.error.message || 'Failed to change password')
          return
        }

        toast.success('Password updated successfully')
        changePasswordForm.reset()
      } catch {
        toast.error('An unexpected error occurred while updating your password')
      }
    },
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-8 md:p-6">
      <header className="space-y-1">
        <h1 className="pt-0">Account</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, security, and appearance preferences.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* PROFILE & AVATAR (mocked upload) */}
        <AccountCard title="Profile">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-full grayscale">
              <AvatarImage src={user.image ?? undefined} alt={user.email} />
              <AvatarFallback className="rounded-lg font-semibold uppercase">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">
                {user.name} {user.lastName}
              </p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-2 text-sm">
            <Label htmlFor={avatarInputId}>Avatar</Label>
            <Input
              id={avatarInputId}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={event => {
                const file = event.target.files?.[0] ?? null
                setSelectedAvatarFile(file)
              }}
            />
            <p className="text-muted-foreground text-sm">
              Avatar uploads are mocked for now. You can choose an image, but it
              is not yet stored with your account.
            </p>
            {selectedAvatarFile && (
              <p className="text-muted-foreground text-xs">
                Selected file:{' '}
                <span className="font-medium">{selectedAvatarFile.name}</span>
              </p>
            )}
          </div>
        </AccountCard>

        {/* THEME PREFERENCES */}
        <AccountCard title="Appearance">
          <p className="mb-0 text-sm">
            Current setting - <span className="font-bold">{themeSetting}</span>
            {themeSetting === 'system' ? (
              <span className="text-xs italic">&nbsp;({theme})</span>
            ) : (
              ''
            )}
          </p>
          <p className="text-muted-foreground text-sm">
            Choose how the app looks. Your preference is saved on this device.
            "System" follows your device setting.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant={themeSetting === 'light' ? 'default' : 'outline'}
              onClick={() => setThemeSetting('light')}
            >
              Light
            </Button>
            <Button
              type="button"
              size="sm"
              variant={themeSetting === 'dark' ? 'default' : 'outline'}
              onClick={() => setThemeSetting('dark')}
            >
              Dark
            </Button>
            <Button
              type="button"
              size="sm"
              variant={themeSetting === 'system' ? 'default' : 'outline'}
              onClick={() => setThemeSetting('system')}
            >
              System
            </Button>
          </div>
        </AccountCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* CHANGE EMAIL */}
        <AccountCard title="Change email">
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault()
              event.stopPropagation()
              changeEmailForm.handleSubmit()
            }}
          >
            <changeEmailForm.Field
              name="email"
              validators={{
                onSubmit: ({value}) => {
                  if (!value.trim()) return 'Email is required'
                },
              }}
            >
              {field => (
                <div className="space-y-1 text-sm">
                  <Label htmlFor="newEmail">New email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </changeEmailForm.Field>

            <changeEmailForm.Field name="confirmEmail">
              {field => (
                <div className="space-y-1 text-sm">
                  <Label htmlFor="confirmEmail">Confirm new email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </changeEmailForm.Field>

            <changeEmailForm.Subscribe>
              {({canSubmit, isSubmitting}) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Sending verification...' : 'Update email'}
                </Button>
              )}
            </changeEmailForm.Subscribe>
          </form>
        </AccountCard>

        {/* CHANGE PASSWORD */}
        <AccountCard title="Change password">
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault()
              event.stopPropagation()
              changePasswordForm.handleSubmit()
            }}
          >
            <input
              type="text"
              name="username"
              autoComplete="username"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <changePasswordForm.Field name="currentPassword">
              {field => (
                <PasswordInput
                  id="currentPassword"
                  label="Current password"
                  labelClassName="block pb-1 font-medium text-foreground text-sm"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="current-password"
                  required
                />
              )}
            </changePasswordForm.Field>

            <changePasswordForm.Field
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
                <PasswordInput
                  id="newPassword"
                  label="New password"
                  labelClassName="block pb-1 font-medium text-foreground text-sm"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="new-password"
                  minLength={minPasswordLength}
                  required
                />
              )}
            </changePasswordForm.Field>

            <changePasswordForm.Field name="confirmNewPassword">
              {field => (
                <PasswordInput
                  id="confirmNewPassword"
                  label="Confirm new password"
                  labelClassName="block pb-1 font-medium text-foreground text-sm"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="new-password"
                  minLength={minPasswordLength}
                  required
                />
              )}
            </changePasswordForm.Field>

            <changePasswordForm.Subscribe>
              {({canSubmit, isSubmitting}) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Updating password...' : 'Update password'}
                </Button>
              )}
            </changePasswordForm.Subscribe>
          </form>
        </AccountCard>
      </section>
    </div>
  )
}

function AccountCard({title, children}: {title: string; children: ReactNode}) {
  return (
    <Card className="group relative h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      <BorderBeam
        className="from-transparent via-cyan-400/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        size={240}
        duration={6}
      />
    </Card>
  )
}
