'use client'

import { cn } from '@/lib/cn'
import { createContext, ReactNode, useContext, useState } from 'react'

const TabsContext = createContext<{ value: string; setValue: (v: string) => void } | null>(null)

export function Tabs({ defaultValue, value: controlled, onValueChange, children, className }: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  children: ReactNode
  className?: string
}) {
  const [internal, setInternal] = useState(defaultValue ?? '')
  const value = controlled ?? internal
  const setValue = (v: string) => { onValueChange ? onValueChange(v) : setInternal(v) }
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('inline-flex items-center gap-1 rounded-md bg-bloom-bg p-1', className)}>{children}</div>
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs')
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn(
        'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-white text-bloom-text shadow-sm' : 'text-bloom-text-mid hover:text-bloom-text',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used within Tabs')
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}
