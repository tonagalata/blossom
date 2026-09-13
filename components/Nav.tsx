'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const active = (href: string) => pathname === href ? 'active' : undefined

  useEffect(() => {
    fetch('/api/members/me').then(r => setSignedIn(r.ok)).catch(() => {})
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)

  async function handleLogout() {
    await fetch('/api/members/logout', { method: 'POST' })
    setSignedIn(false)
    close()
    router.push('/')
  }

  const memberLink = signedIn
    ? { href: '/members', label: 'My Account' }
    : { href: '/membership', label: 'Membership' }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo_b.svg" alt="Events in Bloom — Floral &amp; Event Styling" className="nav-logo-img" />
        </Link>
        <ul className="nav-links">
          <li><Link href="/portfolio" className={active('/portfolio')}>Our Work</Link></li>
          <li><Link href="/#services">Services</Link></li>
          <li><Link href="/about" className={active('/about')}>About</Link></li>
          <li><Link href={memberLink.href} className={active(memberLink.href)}>{memberLink.label}</Link></li>
          {signedIn && (
            <li>
              <button className="nav-logout-btn" onClick={handleLogout}>Sign Out</button>
            </li>
          )}
        </ul>
        <Link href="/inquiry" className="nav-cta">Inquire</Link>
        <button className="nav-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu${open ? ' open' : ''}`}>
        <button className="mobile-menu-close" onClick={close} aria-label="Close menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <ul className="mobile-nav-links">
          <li><Link href="/" onClick={close}>Home</Link></li>
          <li><Link href="/portfolio" onClick={close}>Our Work</Link></li>
          <li><Link href="/#services" onClick={close}>Services</Link></li>
          <li><Link href="/about" onClick={close}>About</Link></li>
          <li><Link href={memberLink.href} onClick={close}>{memberLink.label}</Link></li>
          {signedIn && <li><button className="mobile-nav-logout" onClick={handleLogout}>Sign Out</button></li>}
        </ul>
        <Link href="/inquiry" className="btn btn-solid mobile-book-btn" onClick={close}>Inquire</Link>
      </div>
      <div className={`mobile-menu-overlay${open ? ' open' : ''}`} onClick={close} />
    </>
  )
}
