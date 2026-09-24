'use client'

import { cn } from '@/lib/cn'
import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={cn('w-full max-w-lg rounded-lg bg-white shadow-xl', className)}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-bloom-border px-5 py-4">
            <div>
              {title && <h2 className="text-sm font-semibold text-bloom-text">{title}</h2>}
              {description && <p className="mt-1 text-xs text-bloom-text-mid">{description}</p>}
            </div>
            <button onClick={onClose} className="text-bloom-text-light hover:text-bloom-text" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
