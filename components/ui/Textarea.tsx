import { cn } from '@/lib/cn'
import { TextareaHTMLAttributes, forwardRef } from 'react'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-bloom-border bg-white px-3 py-2 text-sm text-bloom-text',
        'placeholder:text-bloom-text-light focus:outline-none focus:ring-2 focus:ring-bloom-gold/40 focus:border-bloom-gold',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
