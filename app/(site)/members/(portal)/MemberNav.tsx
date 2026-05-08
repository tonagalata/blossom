'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/members', label: 'Dashboard', exact: true },
  { href: '/members/inquiries', label: 'Inquiries' },
  { href: '/members/account', label: 'Account' },
]

export default function MemberNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/members/logout', { method: 'POST' })
    router.push('/members/login')
  }

  return (
    <nav className="member-nav">
      <Link href="/members" className="member-nav-brand">
        <span className="logo-bloom">Members</span>
      </Link>
      <ul className="member-nav-links">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`member-nav-link${(l.exact ? pathname === l.href : pathname.startsWith(l.href)) ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="member-nav-actions">
        <Link href="/" className="member-nav-link member-nav-link-sm">← Site</Link>
        <button className="member-nav-link member-nav-link-sm member-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  )
}
