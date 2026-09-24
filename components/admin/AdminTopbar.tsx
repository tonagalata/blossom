'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Fragment } from 'react'

function toTitle(segment: string) {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AdminTopbar() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean).filter(s => s !== 'admin')

  return (
    <header className="flex h-14 items-center justify-between border-b border-bloom-border bg-white px-6">
      <nav className="flex items-center gap-1.5 text-sm text-bloom-text-mid">
        <Link href="/admin" className="hover:text-bloom-text">Admin</Link>
        {segments.map((seg, i) => {
          const href = '/admin/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1
          const isDynamic = /^[a-f0-9-]{8,}$/i.test(seg) || seg === 'new'
          return (
            <Fragment key={href}>
              <span className="text-bloom-text-light">/</span>
              {isLast ? (
                <span className="font-medium text-bloom-text">{isDynamic ? (seg === 'new' ? 'New' : 'Detail') : toTitle(seg)}</span>
              ) : (
                <Link href={href} className="hover:text-bloom-text">{toTitle(seg)}</Link>
              )}
            </Fragment>
          )
        })}
      </nav>
    </header>
  )
}
