import { cn } from '@/lib/cn'
import { LucideIcon } from 'lucide-react'

export function StatCard({ label, value, icon: Icon, hint, className }: {
  label: string
  value: string
  icon?: LucideIcon
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-bloom-border bg-white p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-bloom-text-mid">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-bloom-gold" />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-bloom-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-bloom-text-light">{hint}</p>}
    </div>
  )
}
