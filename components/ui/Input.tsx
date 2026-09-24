import { cn } from '@/lib/cn'
import { InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-bloom-border bg-white px-3 py-1 text-sm text-bloom-text',
        'placeholder:text-bloom-text-light focus:outline-none focus:ring-2 focus:ring-bloom-gold/40 focus:border-bloom-gold',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
