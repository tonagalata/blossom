import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-bloom-dark text-white hover:bg-bloom-text',
        gold: 'bg-bloom-gold text-white hover:opacity-90',
        outline: 'border border-bloom-border bg-white text-bloom-text hover:bg-bloom-bg',
        ghost: 'text-bloom-text hover:bg-bloom-bg',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'
