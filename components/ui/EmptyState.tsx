import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-bloom-border py-16 text-center">
      {Icon && <Icon className="h-8 w-8 text-bloom-text-light" />}
      <p className="text-sm font-medium text-bloom-text">{title}</p>
      {description && <p className="max-w-sm text-xs text-bloom-text-mid">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
