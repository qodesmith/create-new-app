import type {User} from '@/client/types'

import {ConfirmDialog} from '@/client/components/custom/ConfirmDialog'
import {Field, FieldLabel} from '@/client/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {authClientAtom} from '@/client/state/globalState'
import {userRoles} from '@/shared/constants'

import {useQuery} from '@tanstack/react-query'
import {useAtomValue} from 'jotai'
import {useState} from 'react'
import {toast} from 'sonner'

const roleOptions = Object.values(userRoles)
type RoleOption = (typeof roleOptions)[number]

type ChangeRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
}: ChangeRoleDialogProps) {
  const authClient = useAtomValue(authClientAtom)
  const currentRole = (user?.role ?? userRoles.user) as RoleOption
  const [selectedRole, setSelectedRole] = useState<RoleOption>(currentRole)
  const {run, isPending} = useMutationWithToast(
    (userId: string) => authClient.admin.setRole({userId, role: selectedRole}),
    {
      success: 'Role updated',
      invalidate: ['admin', 'users'],
      context: 'client:adminSetRole:exception',
      errorFallback: 'Failed to update role',
      exception: 'An unexpected error occurred while updating the role',
      onSuccess: () => onOpenChange(false),
    }
  )

  /**
   * Reset the selected role whenever the target user's role changes or the
   * dialog reopens. Done during render (the React-recommended alternative to a
   * reset effect) so there's no extra render and no chance of a stale value.
   */
  const [lastSync, setLastSync] = useState({open, currentRole})
  if (lastSync.open !== open || lastSync.currentRole !== currentRole) {
    setLastSync({open, currentRole})
    if (open) setSelectedRole(currentRole)
  }

  // Proactive last-admin check so we can render a stronger warning in the
  // description before the user clicks Confirm. Only runs when the dialog is
  // open and the target is currently an admin.
  const {data: adminCountData} = useQuery({
    queryKey: ['admin', 'users', 'adminCount'] as const,
    queryFn: async () => {
      const {data, error} = await authClient.admin.listUsers({
        query: {
          filterField: 'role',
          filterValue: userRoles.admin,
          limit: 1,
        },
      })
      if (error) {
        throw new Error(error.message ?? 'Failed to load admin count')
      }
      return data?.total ?? 0
    },
    enabled: open && currentRole === userRoles.admin,
  })

  if (!user) return null

  const isDemotingAdmin =
    currentRole === userRoles.admin && selectedRole !== userRoles.admin
  const isNoChange = selectedRole === currentRole
  const isLastAdmin = isDemotingAdmin && (adminCountData ?? Infinity) <= 1

  async function handleConfirm() {
    if (!user) return

    if (isNoChange) {
      toast.warning('Nothing to change')
      return
    }

    // Last-admin guard: if demoting the only remaining admin, block the change
    // before hitting the mutation seam.
    if (isDemotingAdmin) {
      const {data: adminList, error: listError} =
        await authClient.admin.listUsers({
          query: {
            filterField: 'role',
            filterValue: userRoles.admin,
            limit: 1,
          },
        })

      if (listError) {
        toast.error(
          listError.message ?? 'Failed to verify admin count before role change'
        )
        return
      }

      if ((adminList?.total ?? 0) <= 1) {
        toast.error('Cannot demote the last admin')
        return
      }
    }

    await run(user.id)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Change role for ${user.email}?`}
      description={
        <>
          Current: <strong>{currentRole}</strong> → New:{' '}
          <strong>{selectedRole}</strong>
          {isLastAdmin ? (
            <span className="mt-2 block font-semibold text-destructive">
              This is the last admin. Demoting them will lock everyone out of
              admin tooling — the change will be blocked.
            </span>
          ) : isDemotingAdmin ? (
            <span className="mt-2 block text-destructive">
              You are demoting an admin. They will lose access to admin tooling.
            </span>
          ) : null}
        </>
      }
      confirmLabel="Change role"
      isPending={isPending}
      onConfirm={handleConfirm}
    >
      <Field>
        <FieldLabel htmlFor="changeUserRole">Role</FieldLabel>
        <Select
          value={selectedRole}
          onValueChange={value => setSelectedRole(value as RoleOption)}
        >
          <SelectTrigger id="changeUserRole" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map(role => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </ConfirmDialog>
  )
}
