import type {ColumnDef} from '@tanstack/react-table'
import type {SortDirection, SystemAuditLogsMetadata} from '@/shared/types'

import {Badge} from '@/client/components/ui/badge'

import {SortableHeader} from './-SortableHeader'

export type SystemAuditLogsSortBy = 'action' | 'createdAt'

export type SystemAuditLogRow = {
  id: number
  createdAt: string
  metadata: SystemAuditLogsMetadata
}

type GetSystemAuditLogsColumnsOptions = {
  sortBy: SystemAuditLogsSortBy
  sortDirection: SortDirection | null
  onSort: (key: SystemAuditLogsSortBy) => void
}

export function getSystemAuditLogsColumns({
  sortBy,
  sortDirection,
  onSort,
}: GetSystemAuditLogsColumnsOptions): ColumnDef<SystemAuditLogRow>[] {
  return [
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
      cell: ({row}) => (
        <span className="text-muted-foreground text-sm">
          {row.original.metadata.deletedCount} deleted
        </span>
      ),
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
