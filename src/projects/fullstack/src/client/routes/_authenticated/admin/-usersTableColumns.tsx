import type {ColumnDef} from '@tanstack/react-table'
import type {User} from '@/client/types'
import type {SortDirection} from '@/shared/types'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {Badge} from '@/client/components/ui/badge'
import {Button} from '@/client/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/client/components/ui/tooltip'
import {cn, getUserInitials} from '@/client/lib/utils'

import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BadgeCheckIcon,
} from 'lucide-react'

import {UserRowActions} from './-UserRowActions'

export type UsersSortBy = 'name' | 'email' | 'role' | 'createdAt'

type GetUsersColumnsOptions = {
  currentUserId: string | undefined
  sortBy: UsersSortBy
  sortDirection: SortDirection
  onSort: (key: UsersSortBy) => void
}

function SortableHeader({
  label,
  sortKey,
  sortBy,
  sortDirection,
  onSort,
}: {
  label: string
  sortKey: UsersSortBy
  sortBy: UsersSortBy
  sortDirection: SortDirection
  onSort: (key: UsersSortBy) => void
}) {
  const isActive = sortBy === sortKey
  const Icon = isActive
    ? sortDirection === 'asc'
      ? ArrowUpIcon
      : ArrowDownIcon
    : ArrowUpDownIcon

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 gap-1 px-2 font-medium"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <Icon
        className={cn(
          'size-3.5 transition-opacity',
          isActive ? 'opacity-100' : 'opacity-40'
        )}
      />
    </Button>
  )
}

function formatBanExpires(banExpires: User['banExpires']) {
  if (!banExpires) return 'Permanent'
  const date = banExpires instanceof Date ? banExpires : new Date(banExpires)
  if (Number.isNaN(date.getTime())) return 'Permanent'
  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) return 'Expired'
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days}d ${hours}h remaining`
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

export function getUsersColumns({
  currentUserId,
  sortBy,
  sortDirection,
  onSort,
}: GetUsersColumnsOptions): ColumnDef<User>[] {
  return [
    {
      id: 'name',
      header: () => (
        <SortableHeader
          label="Name"
          sortKey="name"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => {
        const user = row.original
        const isAdmin = user.role === 'admin'
        const fullName = user.lastName
          ? `${user.name} ${user.lastName}`
          : user.name
        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {user.image ? <AvatarImage src={user.image} /> : null}
              <AvatarFallback className="uppercase">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'font-medium',
                isAdmin && 'text-cyan-400 dark:text-cyan-300'
              )}
            >
              {fullName}
            </span>
          </div>
        )
      },
    },
    {
      id: 'email',
      header: () => (
        <SortableHeader
          label="Email"
          sortKey="email"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => {
        const user = row.original
        return (
          <div className="flex items-center gap-1.5">
            <span>{user.email}</span>
            {user.emailVerified ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BadgeCheckIcon
                    className="size-3.5 text-emerald-500"
                    aria-label="Email verified"
                  />
                </TooltipTrigger>
                <TooltipContent>Email verified</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        )
      },
    },
    {
      id: 'role',
      header: () => (
        <SortableHeader
          label="Role"
          sortKey="role"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => {
        const role = row.original.role ?? 'user'
        const isAdmin = role === 'admin'
        return (
          <Badge
            variant={isAdmin ? 'default' : 'secondary'}
            className={cn(
              isAdmin && 'bg-cyan-500 text-white hover:bg-cyan-500/90'
            )}
          >
            {role}
          </Badge>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({row}) => {
        const user = row.original
        if (!user.banned) {
          return <span className="text-muted-foreground text-sm">Active</span>
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="cursor-help">
                Banned
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-0.5">
                <div>
                  <span className="font-medium">Reason: </span>
                  {user.banReason || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Expires: </span>
                  {formatBanExpires(user.banExpires)}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      id: 'createdAt',
      header: () => (
        <SortableHeader
          label="Created"
          sortKey="createdAt"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => {
        const value = row.original.createdAt
        const date = value instanceof Date ? value : new Date(value)
        return (
          <span className="text-muted-foreground text-sm">
            {date.toLocaleDateString()}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({row}) => (
        <div className="flex justify-end">
          <UserRowActions user={row.original} currentUserId={currentUserId} />
        </div>
      ),
    },
  ]
}
