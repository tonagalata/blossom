import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { HTMLAttributes } from 'react'

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'bg-bloom-bg text-bloom-text-mid',
        gold: 'bg-bloom-gold/15 text-bloom-gold',
        sage: 'bg-bloom-sage/15 text-bloom-sage',
        rose: 'bg-bloom-rose/15 text-bloom-rose',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  draft: 'neutral', sent: 'gold', viewed: 'gold', accepted: 'success', paid: 'success',
  declined: 'danger', void: 'danger', overdue: 'danger', expired: 'neutral', partial: 'warning',
  pending: 'gold', cancelled: 'danger',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? 'neutral'}>{status}</Badge>
}
