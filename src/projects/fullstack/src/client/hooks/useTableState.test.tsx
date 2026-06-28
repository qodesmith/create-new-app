import type {ReactNode} from 'react'

import {describe, expect, test} from 'bun:test'

import {tableReducer, useTableState} from '@/client/hooks/useTableState'
import {setupHappyDom} from '@/client/test/happyDom'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react'
import {createElement} from 'react'

setupHappyDom()

/**
 * `useTableState` is the seam all four admin tables run through. The pure
 * `tableReducer` owns the sort-cycle and page-reset invariants — testing it
 * directly is the first unit coverage of that table behaviour (previously it
 * was reachable only through a rendered table). The `renderHook` block covers
 * the wiring the reducer can't: `totalPages` math and setter-driven resets.
 */

type Filter = {q: string}

function baseState(overrides: Partial<ReturnType<typeof makeState>> = {}) {
  return {...makeState(), ...overrides}
}

function makeState() {
  return {
    page: 1,
    pageSize: 25,
    sortBy: 'createdAt' as 'createdAt' | 'name',
    sortDirection: 'desc' as 'asc' | 'desc' | null,
    filter: {q: ''} as Filter,
  }
}

describe('tableReducer', () => {
  test('sorting the active column cycles asc → desc → null → asc', () => {
    let state = baseState({sortDirection: 'asc'})

    state = tableReducer(state, {type: 'sortToggled', key: 'createdAt'})
    expect(state.sortDirection).toBe('desc')

    state = tableReducer(state, {type: 'sortToggled', key: 'createdAt'})
    expect(state.sortDirection).toBe(null)

    state = tableReducer(state, {type: 'sortToggled', key: 'createdAt'})
    expect(state.sortDirection).toBe('asc')
  })

  test('sorting a new column switches sortBy and starts at asc', () => {
    const state = tableReducer(baseState({sortDirection: 'desc'}), {
      type: 'sortToggled',
      key: 'name',
    })

    expect(state.sortBy).toBe('name')
    expect(state.sortDirection).toBe('asc')
  })

  test('any sort change resets to page 1', () => {
    expect(
      tableReducer(baseState({page: 7}), {type: 'sortToggled', key: 'name'})
        .page
    ).toBe(1)
    expect(
      tableReducer(baseState({page: 7}), {
        type: 'sortToggled',
        key: 'createdAt',
      }).page
    ).toBe(1)
  })

  test('changing page size sets it and resets to page 1', () => {
    const state = tableReducer(baseState({page: 4}), {
      type: 'pageSizeChanged',
      pageSize: 50,
    })

    expect(state.pageSize).toBe(50)
    expect(state.page).toBe(1)
  })

  test('changing the filter replaces it and resets to page 1', () => {
    const state = tableReducer(baseState({page: 4}), {
      type: 'filterChanged',
      filter: {q: 'hello'},
    })

    expect(state.filter).toEqual({q: 'hello'})
    expect(state.page).toBe(1)
  })

  test('paging does not reset the page', () => {
    expect(
      tableReducer(baseState({page: 2}), {type: 'pageChanged', page: 3}).page
    ).toBe(3)
  })
})

function wrapper({children}: {children: ReactNode}) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  })
  return createElement(QueryClientProvider, {client: queryClient}, children)
}

const selectItems = (raw: {items: number[]; count: number}) => ({
  rows: raw.items,
  total: raw.count,
})

function renderTableState(total: number) {
  return renderHook(
    () =>
      useTableState({
        resourceKey: ['test'],
        defaultSortBy: 'createdAt' as 'createdAt' | 'name',
        defaultFilter: {q: ''} as Filter,
        fetch: () => Promise.resolve({items: [1, 2, 3], count: total}),
        select: selectItems,
      }),
    {wrapper}
  )
}

describe('useTableState', () => {
  test('totalPages = ceil(total / pageSize), floored at 1; rows come from select', async () => {
    const {result} = renderTableState(80)

    await waitFor(() => expect(result.current.rows).toEqual([1, 2, 3]))
    expect(result.current.total).toBe(80)
    expect(result.current.totalPages).toBe(4) // ceil(80 / 25)
  })

  test('totalPages is at least 1 when there are no rows', async () => {
    const {result} = renderTableState(0)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.totalPages).toBe(1)
  })

  test('setFilter resets page to 1 through the named setter', async () => {
    const {result} = renderTableState(200)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setPage(5))
    expect(result.current.page).toBe(5)

    act(() => result.current.setFilter({q: 'needle'}))
    expect(result.current.page).toBe(1)
    expect(result.current.filter).toEqual({q: 'needle'})
  })

  test('toggleSort cycles direction through the hook', async () => {
    const {result} = renderTableState(10)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.sortDirection).toBe('desc') // default

    act(() => result.current.toggleSort('createdAt')) // desc → null
    expect(result.current.sortDirection).toBe(null)

    act(() => result.current.toggleSort('createdAt')) // null → asc
    expect(result.current.sortDirection).toBe('asc')
  })
})
