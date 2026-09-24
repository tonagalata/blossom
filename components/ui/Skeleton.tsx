import { cn } from '@/lib/cn'
import { HTMLAttributes } from 'react'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-bloom-border/50', className)} {...props} />
}
