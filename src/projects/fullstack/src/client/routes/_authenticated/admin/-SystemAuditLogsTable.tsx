import type {InferResponseType} from 'hono/client'
import type {createApiAdminClient} from '@/client/apiClient'
import type {SystemAuditLogAction} from '@/shared/types'
import type {SystemAuditLogsSortBy} from './-systemAuditLogsColumns'

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
import {systemAuditLogActions} from '@/shared/constants'

import {flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table'
import {parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import {useMemo} from 'react'

import {getSystemAuditLogsColumns} from './-systemAuditLogsColumns'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const ALL_ACTIONS_VALUE = 'all'

type SystemAuditLogsData = InferResponseType<
  ReturnType<typeof createApiAdminClient>['system-audit-logs']['$get']
>
type ActionFilter = SystemAuditLogAction | null

const selectSystemAuditLogs = (raw: SystemAuditLogsData) => ({
  rows: raw.logs,
  total: raw.total,
})

export function SystemAuditLogsTable() {
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
    isLoading: isInitialLoading,
    isFetching,
    error,
  } = useTableState({
    resourceKey: ['admin', 'system-audit-logs'],
    defaultSortBy: 'createdAt' as SystemAuditLogsSortBy,
    defaultFilter: null as ActionFilter,
    fetch: ({page, pageSize, sortBy, sortDirection, filter}) =>
      parseResponse(
        adminClient['system-audit-logs'].$get({
          query: {
            page: String(page),
            pageSize: String(pageSize) as '10' | '25' | '50',
            sortBy,
            ...(sortDirection ? {sortDirection} : {}),
            ...(filter ? {action: filter} : {}),
          },
        })
      ),
    select: selectSystemAuditLogs,
  })

  const columns = useMemo(
    () =>
      getSystemAuditLogsColumns({
        sortBy,
        sortDirection,
        onSort: toggleSort,
      }),
    [sortBy, sortDirection, toggleSort]
  )

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
            value={actionFilter ?? ALL_ACTIONS_VALUE}
            onValueChange={(v: SystemAuditLogAction | 'all') => {
              setFilter(v === ALL_ACTIONS_VALUE ? null : v)
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter by action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ACTIONS_VALUE}>All actions</SelectItem>
              {systemAuditLogActions.map(action => (
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
            {isInitialLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <AudioLoader width={14} height={14} bars={3} gap={1} />
                    Loading entries…
                  </span>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-destructive"
                >
                  {error.message || 'Failed to load entries'}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No entries found.
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
          {isFetching && !isInitialLoading ? (
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
            disabled={page <= 1 || isInitialLoading}
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
            disabled={page >= totalPages || isInitialLoading}
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
