import type {AdminAuditLogAction, SortDirection} from '@/shared/types'
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
import {apiAdminClientAtom} from '@/client/state/globalState'
import {adminAuditLogActions} from '@/shared/constants'

import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table'
import {parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import {useCallback, useMemo, useReducer} from 'react'

import {getAdminAuditLogsColumns} from './-adminAuditLogsColumns'

const PAGE_SIZE_OPTIONS = ['10', '25', '50'] as const
const ALL_ACTIONS = 'all' as const

type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

type TableState = {
  page: number
  pageSize: PageSize
  sortBy: AdminAuditLogsSortBy
  sortDirection: SortDirection | null
  actionFilter: AdminAuditLogAction | undefined
}

type TableAction =
  | {type: 'sortToggled'; key: AdminAuditLogsSortBy}
  | {type: 'actionFilterChanged'; action: AdminAuditLogAction | undefined}
  | {type: 'pageSizeChanged'; pageSize: PageSize}
  | {type: 'pageChanged'; page: number}

const initialTableState: TableState = {
  page: 1,
  pageSize: '25',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  actionFilter: undefined,
}

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'sortToggled': {
      if (state.sortBy === action.key) {
        const sortDirection =
          state.sortDirection === 'asc'
            ? 'desc'
            : state.sortDirection === 'desc'
              ? null
              : 'asc'
        return {...state, sortDirection, page: 1}
      }
      return {...state, sortBy: action.key, sortDirection: 'asc', page: 1}
    }
    case 'actionFilterChanged':
      return {...state, actionFilter: action.action, page: 1}
    case 'pageSizeChanged':
      return {...state, pageSize: action.pageSize, page: 1}
    case 'pageChanged':
      return {...state, page: action.page}
    default:
      action satisfies never
      return state
  }
}

export function AdminAuditLogsTable() {
  const adminClient = useAtomValue(apiAdminClientAtom)

  const [{page, pageSize, sortBy, sortDirection, actionFilter}, dispatch] =
    useReducer(tableReducer, initialTableState)

  const queryParams = {
    page,
    pageSize,
    sortBy,
    sortDirection,
    action: actionFilter,
  }

  const auditLogsQuery = useQuery({
    queryKey: ['admin', 'admin-audit-logs', queryParams],
    queryFn: () =>
      parseResponse(
        adminClient['admin-audit-logs'].$get({
          query: {
            page: `${page}`,
            pageSize,
            ...(sortDirection ? {sortBy, sortDirection} : {}),
            ...(actionFilter ? {action: actionFilter} : {}),
          },
        })
      ),
    placeholderData: keepPreviousData,
  })

  const logs = useMemo<AdminAuditLogRow[]>(
    () => auditLogsQuery.data?.logs ?? [],
    [auditLogsQuery.data]
  )
  const total = auditLogsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / +pageSize))

  const toggleSort = useCallback((key: AdminAuditLogsSortBy) => {
    dispatch({type: 'sortToggled', key})
  }, [])

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

  const isInitialLoading = auditLogsQuery.isLoading
  const isFetching = auditLogsQuery.isFetching
  const error = auditLogsQuery.error
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
              dispatch({
                type: 'actionFilterChanged',
                action: v === ALL_ACTIONS ? undefined : v,
              })
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
            value={pageSize}
            onValueChange={(v: PageSize) => {
              dispatch({type: 'pageSizeChanged', pageSize: v})
            }}
          >
            <SelectTrigger size="sm" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={size}>
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
            onClick={() => dispatch({type: 'pageChanged', page: page - 1})}
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
            onClick={() => dispatch({type: 'pageChanged', page: page + 1})}
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
