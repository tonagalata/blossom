import { cn } from '@/lib/cn'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-bloom-gold/15 text-xs font-semibold text-bloom-gold', className)}>
      {initials(name).toUpperCase() || '?'}
    </div>
  )
}
