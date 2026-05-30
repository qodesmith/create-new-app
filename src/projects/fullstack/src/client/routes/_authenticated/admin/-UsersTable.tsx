import type {User} from '@/client/types'
import type {SortDirection} from '@/shared/types'
import type {UsersSortBy} from './-usersTableColumns'

import {AudioLoader} from '@/client/components/custom/AudioLoader'
import {Button} from '@/client/components/ui/button'
import {Input} from '@/client/components/ui/input'
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
import {TooltipProvider} from '@/client/components/ui/tooltip'
import {cn} from '@/client/lib/utils'
import {authClientAtom, userAtom} from '@/client/state/globalState'

import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table'
import {useAtomValue} from 'jotai'
import {ChevronLeftIcon, ChevronRightIcon, SearchIcon} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {getUsersColumns} from './-usersTableColumns'

type SearchField = 'email' | 'name'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const SEARCH_DEBOUNCE_MS = 250

export function UsersTable() {
  const authClient = useAtomValue(authClientAtom)
  const currentUser = useAtomValue(userAtom)
  const currentUserId = currentUser?.id

  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchField, setSearchField] = useState<SearchField>('email')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25)
  const [sortBy, setSortBy] = useState<UsersSortBy>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    'desc'
  )

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(id)
  }, [searchValue])

  const queryParams = {
    searchValue: debouncedSearch,
    searchField,
    sortBy,
    sortDirection,
    page,
    pageSize,
  }

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', queryParams] as const,
    queryFn: async () => {
      const trimmed = debouncedSearch.trim()
      const {data, error} = await authClient.admin.listUsers({
        query: {
          ...(trimmed
            ? {searchValue: trimmed, searchField, searchOperator: 'contains'}
            : {}),
          limit: pageSize,
          offset: (page - 1) * pageSize,
          ...(sortDirection ? {sortBy, sortDirection} : {}),
        },
      })

      if (error) {
        throw new Error(error.message ?? 'Failed to load users')
      }

      return data
    },
    placeholderData: keepPreviousData,
  })

  /**
   * better-auth's admin plugin types listUsers' result as UserWithRole[], which
   * omits additional fields configured via inferAdditionalFields (e.g.
   * lastName). The server does return them, so cast through unknown.
   */
  const users = useMemo<User[]>(
    () => (usersQuery.data?.users ?? []) as User[],
    [usersQuery.data]
  )
  const total = usersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const toggleSort = useCallback(
    (key: UsersSortBy) => {
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
      getUsersColumns({
        currentUserId,
        sortBy,
        sortDirection,
        onSort: toggleSort,
      }),
    [currentUserId, sortBy, sortDirection, toggleSort]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
  })

  const isInitialLoading = usersQuery.isLoading
  const isFetching = usersQuery.isFetching
  const error = usersQuery.error
  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows
  const columnCount = columns.length

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder={`Search by ${searchField}…`}
                className="w-64 pl-8"
                aria-label="Search users"
              />
            </div>
            <Select
              value={searchField}
              onValueChange={v => {
                setSearchField(v as SearchField)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" aria-label="Search field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="name">Name</SelectItem>
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
                      Loading users…
                    </span>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-24 text-center text-destructive"
                  >
                    {error.message || 'Failed to load users'}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.original.banned && 'bg-muted/40 text-muted-foreground'
                    )}
                  >
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
                {total} {total === 1 ? 'user' : 'users'}
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
    </TooltipProvider>
  )
}
