'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/admin/portfolio', label: 'Portfolio' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/site-content', label: 'Site Content' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="logo-bloom">Events</span>
        <span className="logo-bloom"> in </span>
        <span className="logo-bloom">Bloom</span>
        <span className="admin-sidebar-sub">Admin</span>
      </div>
      <ul className="admin-nav-list">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`admin-nav-link${pathname.startsWith(l.href) ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-nav-link admin-nav-link-sm" target="_blank">
          View Site ↗
        </Link>
        <button className="admin-nav-link admin-nav-link-sm admin-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  )
}
