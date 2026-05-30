import type {User} from '@/client/types'

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
import {Textarea} from '@/client/components/ui/textarea'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {handleFormSubmitInvalid} from '@/client/lib/utils'
import {authClientAtom} from '@/client/state/globalState'

import {useForm} from '@tanstack/react-form'
import {useQueryClient} from '@tanstack/react-query'
import {useAtomValue} from 'jotai'
import {toast} from 'sonner'

const banPresetOptions = [
  'permanent',
  '1h',
  '1d',
  '1w',
  '30d',
  'custom',
] as const
type BanPreset = (typeof banPresetOptions)[number]

const banPresetLabels: Record<BanPreset, string> = {
  permanent: 'Permanent',
  '1h': '1 hour',
  '1d': '1 day',
  '1w': '1 week',
  '30d': '30 days',
  custom: 'Custom',
}

const presetSeconds: Record<
  Exclude<BanPreset, 'permanent' | 'custom'>,
  number
> = {
  '1h': 60 * 60,
  '1d': 60 * 60 * 24,
  '1w': 60 * 60 * 24 * 7,
  '30d': 60 * 60 * 24 * 30,
}

const customUnitOptions = ['hours', 'days'] as const
type CustomUnit = (typeof customUnitOptions)[number]

const customUnitSeconds: Record<CustomUnit, number> = {
  hours: 60 * 60,
  days: 60 * 60 * 24,
}

type BanUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function BanUserDialog({open, onOpenChange, user}: BanUserDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ban {user.email}?</DialogTitle>
          <DialogDescription>
            The user will be signed out of all active sessions and blocked from
            signing in until unbanned or the ban expires.
          </DialogDescription>
        </DialogHeader>
        <BanUserForm key={user.id} user={user} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}

type BanUserFormProps = {
  user: User
  onOpenChange: (open: boolean) => void
}

function BanUserForm({user, onOpenChange}: BanUserFormProps) {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      banReason: '',
      preset: 'permanent' as BanPreset,
      customAmount: '1',
      customUnit: 'days' as CustomUnit,
    },
    onSubmitInvalid: handleFormSubmitInvalid,
    onSubmit: async ({value}) => {
      let banExpiresIn: number | undefined

      if (value.preset === 'permanent') {
        banExpiresIn = undefined
      } else if (value.preset === 'custom') {
        const amount = Number(value.customAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
          toast.error('Custom duration must be a positive number')
          return
        }
        banExpiresIn = Math.floor(amount * customUnitSeconds[value.customUnit])
      } else {
        banExpiresIn = presetSeconds[value.preset]
      }

      const trimmedReason = value.banReason.trim()

      try {
        const {error} = await authClient.admin.banUser({
          userId: user.id,
          banReason: trimmedReason === '' ? undefined : trimmedReason,
          banExpiresIn,
        })

        if (error) {
          toast.error(error.message ?? 'Failed to ban user')
          return
        }

        toast.success('User banned')
        await queryClient.invalidateQueries({queryKey: ['admin', 'users']})
        onOpenChange(false)
      } catch (error) {
        toast.error('An unexpected error occurred while banning the user')
        logClientError({
          error,
          context: 'client:adminBanUser:exception',
        })
      }
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="banReason">
        {field => (
          <Field>
            <FieldLabel htmlFor="banUserReason">Reason (optional)</FieldLabel>
            <Textarea
              id="banUserReason"
              value={field.state.value}
              onChange={event => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              placeholder="Why is this user being banned?"
              rows={3}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="preset">
        {field => (
          <Field>
            <FieldLabel htmlFor="banUserDuration">Duration</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={value => field.handleChange(value as BanPreset)}
            >
              <SelectTrigger id="banUserDuration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {banPresetOptions.map(preset => (
                  <SelectItem key={preset} value={preset}>
                    {banPresetLabels[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      <form.Subscribe selector={state => state.values.preset}>
        {preset =>
          preset === 'custom' ? (
            <div className="flex gap-3">
              <form.Field
                name="customAmount"
                validators={{
                  onSubmit: ({value}) => {
                    const num = Number(value)
                    if (!Number.isFinite(num) || num <= 0) {
                      return 'Must be a positive number'
                    }
                  },
                }}
              >
                {field => (
                  <Field className="flex-1">
                    <FieldLabel htmlFor="banUserCustomAmount">
                      Amount
                    </FieldLabel>
                    <Input
                      id="banUserCustomAmount"
                      type="number"
                      min="1"
                      step="1"
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      required
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="customUnit">
                {field => (
                  <Field className="flex-1">
                    <FieldLabel htmlFor="banUserCustomUnit">Unit</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={value =>
                        field.handleChange(value as CustomUnit)
                      }
                    >
                      <SelectTrigger id="banUserCustomUnit" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {customUnitOptions.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            </div>
          ) : null
        }
      </form.Subscribe>

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
              <Button
                type="submit"
                variant="destructive"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Banning...' : 'Ban user'}
              </Button>
            </>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  )
}
