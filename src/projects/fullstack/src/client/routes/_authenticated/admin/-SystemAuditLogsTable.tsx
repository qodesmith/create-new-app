import type {SortDirection, SystemAuditLogAction} from '@/shared/types'
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
import {apiAdminClientAtom} from '@/client/state/globalState'
import {systemAuditLogActions} from '@/shared/constants'

import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table'
import {parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import {useCallback, useMemo, useState} from 'react'

import {getSystemAuditLogsColumns} from './-systemAuditLogsColumns'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const ALL_ACTIONS_VALUE = 'all'

export function SystemAuditLogsTable() {
  const adminClient = useAtomValue(apiAdminClientAtom)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25)
  const [sortBy, setSortBy] = useState<SystemAuditLogsSortBy>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    'desc'
  )
  const [actionFilter, setActionFilter] = useState<SystemAuditLogAction | null>(
    null
  )

  const queryParams = {
    page,
    pageSize,
    sortBy,
    sortDirection,
    action: actionFilter,
  }

  const logsQuery = useQuery({
    queryKey: ['admin', 'system-audit-logs', queryParams] as const,
    queryFn: () =>
      parseResponse(
        adminClient['system-audit-logs'].$get({
          query: {
            page: String(page),
            pageSize: String(pageSize) as '10' | '25' | '50',
            sortBy,
            ...(sortDirection ? {sortDirection} : {}),
            ...(actionFilter ? {action: actionFilter} : {}),
          },
        })
      ),
    placeholderData: keepPreviousData,
  })

  const logs = useMemo(() => logsQuery.data?.logs ?? [], [logsQuery.data])
  const total = logsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const toggleSort = useCallback(
    (key: SystemAuditLogsSortBy) => {
      if (sortBy === key) {
        setSortDirection(d => {
          if (d === 'asc') return 'desc'
          if (d === 'desc') return null
          return 'asc'
        })
      } else {
        setSortBy(key)
        setSortDirection('asc')
      }
      setPage(1)
    },
    [sortBy]
  )

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

  const isInitialLoading = logsQuery.isLoading
  const isFetching = logsQuery.isFetching
  const error = logsQuery.error
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
              setActionFilter(v === ALL_ACTIONS_VALUE ? null : v)
              setPage(1)
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
              const next = Number(v) as (typeof PAGE_SIZE_OPTIONS)[number]
              setPageSize(next)
              setPage(1)
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
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
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
