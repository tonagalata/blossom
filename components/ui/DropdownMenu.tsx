'use client'

import { cn } from '@/lib/cn'
import { ReactNode, useEffect, useRef, useState } from 'react'

export function DropdownMenu({ trigger, children, align = 'end' }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-1 min-w-[10rem] rounded-md border border-bloom-border bg-white py-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0'
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick, className, destructive }: { children: ReactNode; onClick?: () => void; className?: string; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-bloom-bg',
        destructive ? 'text-red-600' : 'text-bloom-text',
        className
      )}
    >
      {children}
    </button>
  )
}
