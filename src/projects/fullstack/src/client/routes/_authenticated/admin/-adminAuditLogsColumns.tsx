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
import {getUserInitials} from '@/client/lib/utils'
import {adminRoutePath} from '@/shared/constants'

import {DetailText} from './-DetailText'
import {SortableHeader} from './-SortableHeader'

export type AdminAuditLogsSortBy = 'action' | 'createdAt'

type AdminAuditLogsResponse = InferResponseType<
  ReturnType<typeof createApiAdminClient>['admin-audit-logs']['$get']
>

export type AdminAuditLogRow = AdminAuditLogsResponse['logs'][number]

type GetAdminAuditLogsColumnsOptions = {
  sortBy: AdminAuditLogsSortBy
  sortDirection: SortDirection | null
  onSort: (key: AdminAuditLogsSortBy) => void
}

function getDownloadStatusVariant(
  status: 'started' | 'complete' | 'fail'
): 'default' | 'secondary' | 'destructive' {
  if (status === 'complete') return 'default'
  if (status === 'fail') return 'destructive'
  return 'secondary'
}

export function getAdminAuditLogsColumns({
  sortBy,
  sortDirection,
  onSort,
}: GetAdminAuditLogsColumnsOptions): ColumnDef<AdminAuditLogRow>[] {
  return [
    {
      id: 'admin',
      header: 'Admin',
      cell: ({row}) => {
        const {user} = row.original

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
      id: 'action',
      header: () => (
        <SortableHeader
          label="Action"
          sortKey="action"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      ),
      cell: ({row}) => (
        <Badge variant="secondary">{row.original.metadata.action}</Badge>
      ),
    },
    {
      id: 'details',
      header: 'Details',
      cell: ({row}) => {
        const {metadata} = row.original

        switch (metadata.action) {
          case 'download-database':
            return (
              <Badge variant={getDownloadStatusVariant(metadata.status)}>
                {metadata.status}
              </Badge>
            )
          case 'create-user':
            return (
              <DetailText>
                Created {metadata.email}
                {metadata.role ? ` (${metadata.role})` : ''}
              </DetailText>
            )
          case 'update-user':
            return (
              <DetailText>
                Updated {metadata.targetUserId}
                {metadata.updatedFields.length > 0
                  ? ` — ${metadata.updatedFields.join(', ')}`
                  : ''}
              </DetailText>
            )
          case 'set-user-role':
            return (
              <DetailText>
                {metadata.targetUserId} → role {metadata.role}
              </DetailText>
            )
          case 'ban-user':
            return (
              <DetailText>
                Banned {metadata.targetUserId}
                {metadata.banReason ? ` — ${metadata.banReason}` : ''}
              </DetailText>
            )
          case 'unban-user':
            return <DetailText>Unbanned {metadata.targetUserId}</DetailText>
          case 'set-user-password':
            return (
              <DetailText>
                Reset password for {metadata.targetUserId}
              </DetailText>
            )
          case 'remove-user':
            return <DetailText>Removed {metadata.targetUserId}</DetailText>
          case 'revoke-user-session':
            return (
              <DetailText>
                Revoked session {metadata.sessionToken.slice(0, 12)}…
              </DetailText>
            )
          case 'revoke-user-sessions':
            return (
              <DetailText>
                Revoked all sessions for {metadata.targetUserId}
              </DetailText>
            )
          case 'impersonate-user':
            return <DetailText>Impersonated {metadata.targetUserId}</DetailText>
          case 'stop-impersonating':
            return (
              <DetailText>
                Stopped impersonating {metadata.targetUserId}
              </DetailText>
            )
          default:
            return <DetailText>{metadata.deletedCount} deleted</DetailText>
        }
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
      cell: ({row}) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ]
}
