import type {TableUser} from './-usersTableColumns'

import {ConfirmDialog} from '@/client/components/custom/ConfirmDialog'
import {Button} from '@/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'
import {useBoolean} from '@/client/hooks/useBoolean'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {authClientAtom} from '@/client/state/globalState'

import {useQueryClient} from '@tanstack/react-query'
import {useAtomValue} from 'jotai'
import {MoreHorizontalIcon} from 'lucide-react'
import {useState} from 'react'
import {toast} from 'sonner'

import {EditUserDialog} from './-EditUserDialog'

type UserRowActionsProps = {
  user: TableUser
  currentUserId: string | undefined
}

export function UserRowActions({user, currentUserId}: UserRowActionsProps) {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()
  const editDialog = useBoolean()
  const deleteDialog = useBoolean()
  const [isDeleting, setIsDeleting] = useState(false)
  const isSelf = user.id === currentUserId

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const {error} = await authClient.admin.removeUser({userId: user.id})

      if (error) {
        toast.error(error.message ?? 'Failed to delete user')
        return
      }

      toast.success(`User ${user.email} deleted`)
      await queryClient.invalidateQueries({queryKey: ['admin', 'users']})
      deleteDialog.setFalse()
    } catch (error) {
      toast.error('An unexpected error occurred while deleting the user')
      logClientError({
        error,
        context: 'client:adminRemoveUser:exception',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Open user actions"
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={editDialog.setTrue}>
            Edit user
          </DropdownMenuItem>
          {!isSelf && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={deleteDialog.setTrue}
            >
              Delete user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        open={editDialog.value}
        onOpenChange={editDialog.setValue}
        user={user}
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onOpenChange={deleteDialog.setValue}
        title={`Delete ${user.email}?`}
        description={
          <>
            This permanently deletes the user and cascades to their sessions,
            accounts, passkeys, and verification rows. This action is{' '}
            <strong>irreversible</strong>. Consider banning the user instead if
            you may want to restore access later.
          </>
        }
        confirmLabel="Delete user"
        variant="destructive"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
