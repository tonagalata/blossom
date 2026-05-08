'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PlanButton({ planId }: { planId: string }) {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/members/me')
      .then(r => setSignedIn(r.ok))
      .catch(() => setSignedIn(false))
  }, [])

  async function handleClick() {
    if (!signedIn) {
      router.push(`/members/signup?plan=${planId}`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/members/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Could not start subscription.')
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn plan-cta" onClick={handleClick} disabled={loading || signedIn === null}>
      {loading ? 'Loading…' : 'Get Started'}
    </button>
  )
}

export function MembershipHint() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/members/me').then(r => setSignedIn(r.ok)).catch(() => setSignedIn(false))
  }, [])

  if (signedIn === null || signedIn) return null

  return (
    <div className="membership-login-hint">
      Already a member?{' '}
      <Link href="/members/login" className="link">Sign in</Link>
    </div>
  )
}
