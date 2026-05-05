'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const active = (href: string) => pathname === href ? 'active' : undefined

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

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-text">
            <span className="logo-bloom">Events</span>
            <em className="logo-bloom">in</em>
            <span className="logo-bloom">Bloom</span>
          </span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/" className={active('/')}>Home</Link></li>
          <li><Link href="/portfolio" className={active('/portfolio')}>Portfolio</Link></li>
          <li><Link href="/inquiry" className={active('/inquiry')}>Inquire</Link></li>
          <li><Link href="/#about">About</Link></li>
        </ul>
        <Link href="/inquiry" className="nav-cta">Book Now</Link>
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
          <li><Link href="/portfolio" onClick={close}>Portfolio</Link></li>
          <li><Link href="/inquiry" onClick={close}>Inquire</Link></li>
        </ul>
        <Link href="/inquiry" className="btn mobile-book-btn" onClick={close}>Book Now</Link>
      </div>
      <div className={`mobile-menu-overlay${open ? ' open' : ''}`} onClick={close} />
    </>
  )
}
