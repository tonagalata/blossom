import { cn } from '@/lib/cn'
import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full appearance-none rounded-md border border-bloom-border bg-white px-3 py-1 pr-8 text-sm text-bloom-text',
          'focus:outline-none focus:ring-2 focus:ring-bloom-gold/40 focus:border-bloom-gold',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-bloom-text-light" />
    </div>
  )
)
Select.displayName = 'Select'
