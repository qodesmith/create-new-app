import type {TableUser} from './-usersTableColumns'

import {Button} from '@/client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/client/components/ui/dropdown-menu'

import {MoreHorizontalIcon} from 'lucide-react'

type UserRowActionsProps = {
  user: TableUser
  currentUserId: string | undefined
}

export function UserRowActions({user, currentUserId}: UserRowActionsProps) {
  const isSelf = user.id === currentUserId

  return (
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
        <DropdownMenuItem disabled>
          {isSelf ? 'No self actions yet' : 'No actions yet'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
