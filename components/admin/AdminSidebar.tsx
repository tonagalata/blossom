'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  Image as ImageIcon, LayoutGrid, FileText, Home, MousePointerClick,
  Inbox, Users, UserSquare2, FileSignature, Receipt, CreditCard,
  ChevronsLeft, ChevronsRight, ExternalLink, LogOut,
} from 'lucide-react'

interface NavLink {
  href: string
  label: string
  icon: typeof Home
}

interface NavGroup {
  heading: string
  items: NavLink[]
}

const groups: NavGroup[] = [
  {
    heading: 'Content',
    items: [
      { href: '/admin/portfolio', label: 'Portfolio', icon: LayoutGrid },
      { href: '/admin/images', label: 'Images', icon: ImageIcon },
      { href: '/admin/site-content', label: 'Site Content', icon: FileText },
      { href: '/admin/landing-content', label: 'Landing Page', icon: Home },
      { href: '/admin/about-content', label: 'About Page', icon: FileText },
      { href: '/admin/popup', label: 'Popup', icon: MousePointerClick },
    ],
  },
  {
    heading: 'CRM',
    items: [
      { href: '/admin/inquiries', label: 'Inquiries', icon: Inbox },
      { href: '/admin/members', label: 'Members', icon: Users },
    ],
  },
  {
    heading: 'Business',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: UserSquare2 },
      { href: '/admin/proposals', label: 'Proposals', icon: FileSignature },
      { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_sidebar_collapsed')
    if (stored === '1') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed(c => {
      localStorage.setItem('admin_sidebar_collapsed', c ? '0' : '1')
      return !c
    })
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <nav className={cn('sticky top-0 flex h-screen shrink-0 flex-col border-r border-bloom-border bg-white transition-all', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex items-center justify-between border-b border-bloom-border px-4 py-4">
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-bloom-script text-lg text-bloom-gold">Events in Bloom</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-bloom-text-light">Admin</p>
          </div>
        )}
        <button onClick={toggleCollapsed} className="text-bloom-text-light hover:text-bloom-text" aria-label="Toggle sidebar">
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map(group => (
          <div key={group.heading}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-bloom-text-light">{group.heading}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-bloom-gold/15 text-bloom-gold' : 'text-bloom-text-mid hover:bg-bloom-bg hover:text-bloom-text'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-0.5 border-t border-bloom-border px-3 py-3">
        <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-bloom-text-mid hover:bg-bloom-bg hover:text-bloom-text">
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && <span>View Site</span>}
        </Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-bloom-text-mid hover:bg-bloom-bg hover:text-bloom-text">
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </nav>
  )
}
