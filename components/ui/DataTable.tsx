'use client'

import { cn } from '@/lib/cn'
import { ReactNode, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

export function DataTable<T>({ columns, rows, loading, emptyTitle = 'Nothing here yet', emptyDescription, onRowClick, rowKey }: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col?.sortValue) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sort, columns])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-bloom-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bloom-border bg-bloom-bg/50 text-left">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn('px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-bloom-text-mid', col.sortValue && 'cursor-pointer select-none', col.className)}
                onClick={() => {
                  if (!col.sortValue) return
                  setSort(s => s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' })
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sort?.key === col.key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr
              key={rowKey(row)}
              className={cn('border-b border-bloom-border last:border-0', onRowClick && 'cursor-pointer hover:bg-bloom-bg/40')}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={col.key} className={cn('px-4 py-3 text-bloom-text', col.className)}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
