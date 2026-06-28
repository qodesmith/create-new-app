import type {SortDirection} from '@/shared/types'

import {Button} from '@/client/components/ui/button'
import {cn} from '@/client/lib/utils'

import {ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon} from 'lucide-react'

export function SortableHeader<TKey extends string>({
  label,
  sortKey,
  sortBy,
  sortDirection,
  onSort,
}: {
  label: string
  sortKey: TKey
  sortBy: TKey
  sortDirection: SortDirection | null
  onSort: (key: TKey) => void
}) {
  const isActive = sortBy === sortKey && sortDirection !== null
  const Icon = isActive
    ? sortDirection === 'asc'
      ? ArrowUpIcon
      : ArrowDownIcon
    : ArrowUpDownIcon

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 gap-1 px-2 font-medium"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <Icon
        className={cn(
          'size-3.5 transition-opacity',
          isActive ? 'opacity-100' : 'opacity-40'
        )}
      />
    </Button>
  )
}
