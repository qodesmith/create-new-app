import type {ErrorContext, SortDirection} from '@/shared/types'
import type {ErrorRow, ErrorsSortBy} from './-errorsColumns'

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
import {errorContexts} from '@/shared/constants'

import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table'
import {parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import {useCallback, useMemo, useState} from 'react'

import {ErrorDetailDialog} from './-ErrorDetailDialog'
import {getErrorsColumns} from './-errorsColumns'

const PAGE_SIZE_OPTIONS = ['10', '25', '50'] as const
const ALL_CONTEXTS = 'all' as const
const CATEGORY_OPTIONS = ['all', 'client', 'server'] as const

type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]
type Category = (typeof CATEGORY_OPTIONS)[number]

export function ErrorsTable() {
  const adminClient = useAtomValue(apiAdminClientAtom)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>('25')
  const [sortBy, setSortBy] = useState<ErrorsSortBy>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    'desc'
  )
  const [category, setCategory] = useState<Category>('all')
  const [contextFilter, setContextFilter] = useState<ErrorContext | undefined>()
  const [activeError, setActiveError] = useState<ErrorRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const queryParams = {
    page,
    pageSize,
    sortBy,
    sortDirection,
    category,
    context: contextFilter,
  }

  const {
    data: errorsData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['admin', 'errors', queryParams],
    queryFn: () =>
      parseResponse(
        adminClient.errors.$get({
          query: {
            page: `${page}`,
            pageSize,
            ...(sortDirection ? {sortBy, sortDirection} : {}),
            ...(category === 'all' ? {} : {category}),
            ...(contextFilter ? {context: contextFilter} : {}),
          },
        })
      ),
    placeholderData: keepPreviousData,
  })

  const errors = useMemo<ErrorRow[]>(
    () => errorsData?.errors ?? [],
    [errorsData?.errors]
  )
  const total = errorsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / +pageSize))

  const toggleSort = useCallback(
    (key: ErrorsSortBy) => {
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

  const onView = useCallback((row: ErrorRow) => {
    setActiveError(row)
    setDetailOpen(true)
  }, [])

  const columns = useMemo(() => {
    return getErrorsColumns({
      sortBy,
      sortDirection,
      onSort: toggleSort,
      onView,
    })
  }, [sortBy, sortDirection, toggleSort, onView])

  const table = useReactTable({
    data: errors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
  })

  const headerGroups = table.getHeaderGroups()
  const {rows} = table.getRowModel()
  const columnCount = columns.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={category}
            onValueChange={(v: Category) => {
              setCategory(v)
              setPage(1)
            }}
          >
            <SelectTrigger size="sm" className="w-36" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="server">Server</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={contextFilter ?? ALL_CONTEXTS}
            onValueChange={(v: ErrorContext | typeof ALL_CONTEXTS) => {
              setContextFilter(v === ALL_CONTEXTS ? undefined : v)
              setPage(1)
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-72"
              aria-label="Context filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CONTEXTS}>All contexts</SelectItem>
              {errorContexts.map(context => (
                <SelectItem key={context} value={context}>
                  {context}
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
              setPageSize(v)
              setPage(1)
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <AudioLoader width={14} height={14} bars={3} gap={1} />
                    Loading errors…
                  </span>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-destructive"
                >
                  {error.message || 'Failed to load errors'}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No errors found.
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
            onClick={() => setPage(p => Math.max(1, p - 1))}
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
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            aria-label="Next page"
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <ErrorDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        error={activeError}
      />
    </div>
  )
}
