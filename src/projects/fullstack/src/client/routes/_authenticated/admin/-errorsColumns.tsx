import type {ColumnDef} from '@tanstack/react-table'
import type {InferResponseType} from 'hono/client'
import type {createApiAdminClient} from '@/client/apiClient'
import type {SortDirection} from '@/shared/types'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {Badge} from '@/client/components/ui/badge'
import {Button} from '@/client/components/ui/button'
import {getUserInitials} from '@/client/lib/utils'
import {adminRoutePath} from '@/shared/constants'

import {SortableHeader} from './-SortableHeader'

export type ErrorsSortBy = 'context' | 'createdAt'

type ErrorsResponse = InferResponseType<
  ReturnType<typeof createApiAdminClient>['errors']['$get']
>

export type ErrorRow = ErrorsResponse['errors'][number]

type GetErrorsColumnsOptions = {
  sortBy: ErrorsSortBy
  sortDirection: SortDirection | null
  onSort: (key: ErrorsSortBy) => void
  onView: (row: ErrorRow) => void
}

/**
 * Single-line summary for the Error column. The JSON `error` blob is untyped
 * (`Record<string, unknown>`), so coerce its likely fields to strings.
 */
function getErrorSummary(error: ErrorRow['error']): string {
  const message = error.message ?? error.name
  return typeof message === 'string' && message ? message : 'Unknown error'
}

export function getErrorsColumns({
  sortBy,
  sortDirection,
  onSort,
  onView,
}: GetErrorsColumnsOptions): ColumnDef<ErrorRow>[] {
  return [
    {
      id: 'createdAt',
      header: () => (
        <SortableHeader
          label="When"
          sortKey="createdAt"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => (
        <span className="whitespace-nowrap text-muted-foreground text-sm">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'context',
      header: () => (
        <SortableHeader
          label="Context"
          sortKey="context"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => {
        const {context} = row.original
        const isClient = context.startsWith('client:')

        return (
          <Badge variant={isClient ? 'secondary' : 'outline'}>{context}</Badge>
        )
      },
    },
    {
      id: 'user',
      header: 'User',
      cell: ({row}) => {
        const {user} = row.original

        if (!user) {
          return <span className="text-muted-foreground text-sm">System</span>
        }

        return (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarImage src={`${adminRoutePath}/avatar/${user.id}`} />
              <AvatarFallback className="uppercase">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {user.name} {user.lastName}
              </span>
              <span className="text-muted-foreground text-sm">
                {user.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'error',
      header: 'Error',
      cell: ({row}) => {
        const summary = getErrorSummary(row.original.error)

        return (
          <div className="flex items-center gap-2">
            <span className="max-w-md truncate text-sm" title={summary}>
              {summary}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => onView(row.original)}
            >
              View
            </Button>
          </div>
        )
      },
    },
  ]
}
