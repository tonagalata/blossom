'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MemberData {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  subscription_status: string | null
  plan_id: string | null
  current_period_end: string | null
}

const statusLabel: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past Due',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
}

export default function MemberDashboard() {
  const router = useRouter()
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/members/me')
      .then(r => {
        if (r.status === 401) { router.push('/members/login'); return null }
        return r.json()
      })
      .then(d => { if (d) setMember(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/members/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) return <div className="member-loading">Loading…</div>
  if (!member) return null

  const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email
  const status = member.subscription_status
  const periodEnd = member.current_period_end
    ? new Date(member.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="member-dashboard">
      <h1 className="member-page-title">Welcome, {name}</h1>

      <div className="member-cards">
        <div className="member-card">
          <h2 className="member-card-title">Subscription</h2>
          {status ? (
            <>
              <p className="member-status-badge" data-status={status}>
                {statusLabel[status] ?? status}
              </p>
              {periodEnd && (
                <p className="member-card-detail">
                  {status === 'canceled' ? 'Access until' : 'Renews'}: {periodEnd}
                </p>
              )}
              <button
                className="btn member-portal-btn"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? 'Opening…' : 'Manage Subscription'}
              </button>
            </>
          ) : (
            <>
              <p className="member-card-detail">No active subscription.</p>
              <Link href="/membership" className="btn member-portal-btn">
                View Plans
              </Link>
            </>
          )}
        </div>

        <div className="member-card">
          <h2 className="member-card-title">Inquiries</h2>
          <p className="member-card-detail">Submit questions or requests directly to our team.</p>
          <Link href="/members/inquiries" className="btn member-portal-btn">
            My Inquiries
          </Link>
        </div>
      </div>
    </div>
  )
}
