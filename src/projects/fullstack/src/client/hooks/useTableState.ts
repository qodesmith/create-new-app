import type {SortDirection} from '@/shared/types'

import {keepPreviousData, useQuery} from '@tanstack/react-query'
import {useCallback, useReducer} from 'react'

const DEFAULT_PAGE_SIZE = 25

/**
 * The shared state behind all four admin tables. `pageSize` is always a number
 * here (easier math for `totalPages`/`offset`); each table's `fetch` formats it
 * for its own wire call. `filter` is opaque — the reducer never inspects it, so
 * a scalar (`AdminAuditLogAction`) and an object (`{category, context}`) both
 * fit without the hook knowing their shape.
 */
type TableState<SortBy extends string, Filter> = {
  page: number
  pageSize: number
  sortBy: SortBy
  sortDirection: SortDirection | null
  filter: Filter
}

type TableAction<SortBy extends string, Filter> =
  | {type: 'sortToggled'; key: SortBy}
  | {type: 'pageChanged'; page: number}
  | {type: 'pageSizeChanged'; pageSize: number}
  | {type: 'filterChanged'; filter: Filter}

/**
 * The pure core. Exported so the sort-cycle and page-reset invariants can be
 * unit-tested directly, without rendering a table.
 *
 * Invariants:
 * - Sorting the active column cycles asc → desc → null → asc.
 * - Sorting a new column starts at asc.
 * - Any sort, page-size, or filter change resets to page 1.
 */
export function tableReducer<SortBy extends string, Filter>(
  state: TableState<SortBy, Filter>,
  action: TableAction<SortBy, Filter>
): TableState<SortBy, Filter> {
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
    case 'pageChanged':
      return {...state, page: action.page}
    case 'pageSizeChanged':
      return {...state, pageSize: action.pageSize, page: 1}
    case 'filterChanged':
      return {...state, filter: action.filter, page: 1}
    default:
      return state
  }
}

type UseTableStateOptions<SortBy extends string, Filter, Raw, Row> = {
  /** queryKey prefix, e.g. ['admin', 'admin-audit-logs']. */
  resourceKey: readonly unknown[]
  defaultSortBy: SortBy
  defaultFilter: Filter
  /**
   * The one table-specific async bit: maps the typed state to a wire call. The
   * table closes over its own transport (Hono RPC, better-auth) and filter.
   */
  fetch: (state: TableState<SortBy, Filter>) => Promise<Raw>
  /**
   * Pulls rows + total out of the raw payload (keys differ: `.users`/`.logs`/
   * `.errors`). Pass a stable, module-level function so the query result stays
   * referentially stable for `useReactTable`.
   */
  select: (raw: Raw) => {rows: Row[]; total: number}
  defaultSortDirection?: SortDirection | null
  defaultPageSize?: number
}

type UseTableStateResult<SortBy extends string, Filter, Row> = {
  page: number
  pageSize: number
  sortBy: SortBy
  sortDirection: SortDirection | null
  filter: Filter
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  toggleSort: (key: SortBy) => void
  setFilter: (filter: Filter) => void
  rows: Row[]
  total: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean
  error: Error | null
}

/**
 * Collapses the page/sort/filter controls + paginated query that every admin
 * table re-declares. Owns the asc→desc→null sort cycle, the three page-reset
 * rules, and the `useQuery` wiring (`keepPreviousData`, key assembly,
 * `totalPages`). Filtering and rendering stay at the call site — `fetch` and
 * `select` are the only table-specific seams.
 */
export function useTableState<SortBy extends string, Filter, Raw, Row>({
  resourceKey,
  defaultSortBy,
  defaultFilter,
  fetch,
  select,
  defaultSortDirection = 'desc',
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: UseTableStateOptions<SortBy, Filter, Raw, Row>): UseTableStateResult<
  SortBy,
  Filter,
  Row
> {
  const [state, dispatch] = useReducer(
    tableReducer<SortBy, Filter>,
    undefined,
    (): TableState<SortBy, Filter> => ({
      page: 1,
      pageSize: defaultPageSize,
      sortBy: defaultSortBy,
      sortDirection: defaultSortDirection,
      filter: defaultFilter,
    })
  )

  const {page, pageSize, sortBy, sortDirection, filter} = state

  const {data, isLoading, isFetching, error} = useQuery({
    queryKey: [...resourceKey, {page, pageSize, sortBy, sortDirection, filter}],
    queryFn: () => fetch(state),
    select,
    placeholderData: keepPreviousData,
  })

  const setPage = useCallback(
    (page: number) => dispatch({type: 'pageChanged', page}),
    []
  )
  const setPageSize = useCallback(
    (pageSize: number) => dispatch({type: 'pageSizeChanged', pageSize}),
    []
  )
  const toggleSort = useCallback(
    (key: SortBy) => dispatch({type: 'sortToggled', key}),
    []
  )
  const setFilter = useCallback(
    (filter: Filter) => dispatch({type: 'filterChanged', filter}),
    []
  )

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    page,
    pageSize,
    sortBy,
    sortDirection,
    filter,
    setPage,
    setPageSize,
    toggleSort,
    setFilter,
    rows,
    total,
    totalPages,
    isLoading,
    isFetching,
    error,
  }
}
