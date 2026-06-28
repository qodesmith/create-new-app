import type {AdminAuditLogAction} from '@/shared/types'
import type {
  AdminAuditLogRow,
  AdminAuditLogsSortBy,
} from './-adminAuditLogsColumns'

import {AudioLoader} from '@/client/components/custom/AudioLoader'
import {Button} from '@/client/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'
import {useTableState} from '@/client/hooks/useTableState'
import {apiAdminClientAtom} from '@/client/state/globalState'
import {adminAuditLogActions} from '@/shared/constants'

import {flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table'
import {parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import {useMemo} from 'react'

import {getAdminAuditLogsColumns} from './-adminAuditLogsColumns'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const ALL_ACTIONS = 'all' as const

type AdminAuditLogsData = {logs: AdminAuditLogRow[]; total: number}
type ActionFilter = AdminAuditLogAction | undefined

const selectAdminAuditLogs = (raw: AdminAuditLogsData) => ({
  rows: raw.logs,
  total: raw.total,
})

export function AdminAuditLogsTable() {
  const adminClient = useAtomValue(apiAdminClientAtom)

  const {
    page,
    pageSize,
    sortBy,
    sortDirection,
    filter: actionFilter,
    setPage,
    setPageSize,
    toggleSort,
    setFilter,
    rows: logs,
    total,
    totalPages,
    isLoading,
    isFetching,
    error,
  } = useTableState({
    resourceKey: ['admin', 'admin-audit-logs'],
    defaultSortBy: 'createdAt' as AdminAuditLogsSortBy,
    defaultFilter: undefined as ActionFilter,
    fetch: ({page, pageSize, sortBy, sortDirection, filter}) =>
      parseResponse(
        adminClient['admin-audit-logs'].$get({
          query: {
            page: `${page}`,
            pageSize: String(pageSize) as '10' | '25' | '50',
            ...(sortDirection ? {sortBy, sortDirection} : {}),
            ...(filter ? {action: filter} : {}),
          },
        })
      ),
    select: selectAdminAuditLogs,
  })

  const columns = useMemo(() => {
    return getAdminAuditLogsColumns({
      sortBy,
      sortDirection,
      onSort: toggleSort,
    })
  }, [sortBy, sortDirection, toggleSort])

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
  })

  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows
  const columnCount = columns.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={actionFilter ?? ALL_ACTIONS}
            onValueChange={(v: AdminAuditLogAction | typeof ALL_ACTIONS) => {
              setFilter(v === ALL_ACTIONS ? undefined : v)
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-64"
              aria-label="Action filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ACTIONS}>All actions</SelectItem>
              {adminAuditLogActions.map(action => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={v => {
              setPageSize(Number(v))
            }}
          >
            <SelectTrigger size="sm" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {headerGroups.map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <AudioLoader width={14} height={14} bars={3} gap={1} />
                    Loading audit logs…
                  </span>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-destructive"
                >
                  {error.message || 'Failed to load audit logs'}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          {isFetching && !isLoading ? (
            <span className="inline-flex items-center gap-2">
              <AudioLoader width={12} height={12} bars={3} gap={1} />
              Updating…
            </span>
          ) : (
            <>
              {total} {total === 1 ? 'entry' : 'entries'}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1 || isLoading}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
            Prev
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || isLoading}
            aria-label="Next page"
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
