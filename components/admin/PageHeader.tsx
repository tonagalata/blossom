import { ReactNode } from 'react'

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-bloom-text">{title}</h1>
        {description && <div className="mt-1 text-sm text-bloom-text-mid">{description}</div>}
      </div>
      {action}
    </div>
  )
}
