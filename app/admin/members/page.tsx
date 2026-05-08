'use client'
import { useEffect, useState } from 'react'

interface Plan {
  id: string
  stripe_price_id: string | null
  name: string
  description: string | null
  amount: number
  interval: 'month' | 'year'
  features: string[]
  active: number
  sort_order: number
}

interface Member {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  subscription_status: string | null
  plan_id: string | null
  current_period_end: string | null
}

interface MemberInquiry {
  id: string
  member_id: string
  created_at: string
  subject: string
  message: string
  status: string
  reply: string | null
  member_email: string
  member_name: string
}

type Tab = 'plans' | 'members' | 'inquiries'

export default function AdminMembersPage() {
  const [tab, setTab] = useState<Tab>('plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [inquiries, setInquiries] = useState<MemberInquiry[]>([])
  const [loading, setLoading] = useState(true)

  // plan form
  const [planForm, setPlanForm] = useState({ name: '', description: '', amountDollars: '', interval: 'month', features: '', sortOrder: '0' })
  const [planSaving, setPlanSaving] = useState(false)
  const [planError, setPlanError] = useState('')
  const [showPlanForm, setShowPlanForm] = useState(false)

  // inquiry reply
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    const [plansRes, membersRes, inquiriesRes] = await Promise.all([
      fetch('/api/admin/plans'),
      fetch('/api/admin/members'),
      fetch('/api/admin/members/inquiries'),
    ])
    if (plansRes.ok) { const d = await plansRes.json(); setPlans(d.plans || []) }
    if (membersRes.ok) { const d = await membersRes.json(); setMembers(d.members || []) }
    if (inquiriesRes.ok) { const d = await inquiriesRes.json(); setInquiries(d.inquiries || []) }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function createPlan(e: React.FormEvent) {
    e.preventDefault()
    setPlanError('')
    setPlanSaving(true)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          description: planForm.description || undefined,
          amountDollars: parseFloat(planForm.amountDollars),
          interval: planForm.interval,
          features: planForm.features ? planForm.features.split('\n').map(s => s.trim()).filter(Boolean) : [],
          sortOrder: parseInt(planForm.sortOrder) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPlanError(data.error || 'Failed to create plan'); return }
      setPlanForm({ name: '', description: '', amountDollars: '', interval: 'month', features: '', sortOrder: '0' })
      setShowPlanForm(false)
      await loadAll()
    } catch {
      setPlanError('Something went wrong.')
    } finally {
      setPlanSaving(false)
    }
  }

  async function togglePlanActive(plan: Plan) {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !plan.active }),
    })
    await loadAll()
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan? Members already subscribed will not be affected.')) return
    await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    await loadAll()
  }

  async function submitReply(id: string) {
    if (!replyText.trim()) return
    setReplySaving(true)
    try {
      await fetch(`/api/admin/members/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      })
      setReplyingId(null)
      setReplyText('')
      await loadAll()
    } finally {
      setReplySaving(false)
    }
  }

  const statusColor: Record<string, string> = {
    active: '#2e7d32', trialing: '#1565c0', past_due: '#e65100', canceled: '#757575', incomplete: '#827717',
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Members</h1>
      </div>

      <div className="admin-tabs">
        {(['plans', 'members', 'inquiries'] as Tab[]).map(t => (
          <button
            key={t}
            className={`admin-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'inquiries' && inquiries.filter(i => i.status === 'open').length > 0 && (
              <span className="admin-tab-badge">{inquiries.filter(i => i.status === 'open').length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <p className="admin-loading">Loading…</p> : (
        <>
          {/* ─── Plans ─────────────────────────────────────────── */}
          {tab === 'plans' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <h2 className="admin-section-title">Membership Plans</h2>
                <button className="btn admin-add-btn" onClick={() => setShowPlanForm(f => !f)}>
                  {showPlanForm ? 'Cancel' : '+ New Plan'}
                </button>
              </div>

              {showPlanForm && (
                <form onSubmit={createPlan} className="admin-form">
                  {planError && <p className="form-error">{planError}</p>}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input className="form-input" value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price (USD)</label>
                      <input type="number" step="0.01" min="0.50" className="form-input" value={planForm.amountDollars} onChange={e => setPlanForm(f => ({ ...f, amountDollars: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Billing Interval</label>
                      <select className="form-input" value={planForm.interval} onChange={e => setPlanForm(f => ({ ...f, interval: e.target.value }))}>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sort Order</label>
                      <input type="number" className="form-input" value={planForm.sortOrder} onChange={e => setPlanForm(f => ({ ...f, sortOrder: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Features (one per line)</label>
                    <textarea className="form-input form-textarea" rows={4} value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} placeholder="Priority booking&#10;Exclusive discounts&#10;Monthly newsletter" />
                  </div>
                  <button type="submit" className="btn" disabled={planSaving}>
                    {planSaving ? 'Creating…' : 'Create Plan'}
                  </button>
                </form>
              )}

              {plans.length === 0 ? (
                <p className="admin-empty">No plans yet. Create one above.</p>
              ) : (
                <div className="admin-plan-list">
                  {plans.map(plan => (
                    <div key={plan.id} className={`admin-plan-card${!plan.active ? ' inactive' : ''}`}>
                      <div className="admin-plan-header">
                        <div>
                          <strong>{plan.name}</strong>
                          {!plan.active && <span className="admin-plan-inactive-badge">Inactive</span>}
                          <p className="admin-plan-price">
                            ${(plan.amount / 100).toFixed(2)}/{plan.interval}
                          </p>
                        </div>
                        <div className="admin-plan-actions">
                          <button
                            className="admin-btn-sm"
                            onClick={() => togglePlanActive(plan)}
                          >
                            {plan.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="admin-btn-sm admin-btn-danger"
                            onClick={() => deletePlan(plan.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {plan.description && <p className="admin-plan-desc">{plan.description}</p>}
                      {plan.features.length > 0 && (
                        <ul className="admin-plan-features">
                          {plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                        </ul>
                      )}
                      {plan.stripe_price_id && (
                        <p className="admin-plan-stripe-id">Stripe: {plan.stripe_price_id}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Members ───────────────────────────────────────── */}
          {tab === 'members' && (
            <div className="admin-section">
              <h2 className="admin-section-title">All Members ({members.length})</h2>
              {members.length === 0 ? (
                <p className="admin-empty">No members yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name / Email</th>
                        <th>Status</th>
                        <th>Renews</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td>
                            <div>{[m.first_name, m.last_name].filter(Boolean).join(' ') || '—'}</div>
                            <div className="admin-table-sub">{m.email}</div>
                          </td>
                          <td>
                            {m.subscription_status ? (
                              <span
                                className="member-status-pill"
                                style={{ background: statusColor[m.subscription_status] ?? '#757575' }}
                              >
                                {m.subscription_status}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            {m.current_period_end
                              ? new Date(m.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                          <td>{new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Inquiries ─────────────────────────────────────── */}
          {tab === 'inquiries' && (
            <div className="admin-section">
              <h2 className="admin-section-title">Member Inquiries ({inquiries.length})</h2>
              {inquiries.length === 0 ? (
                <p className="admin-empty">No inquiries yet.</p>
              ) : (
                inquiries.map(inq => (
                  <div key={inq.id} className={`admin-member-inq status-${inq.status}`}>
                    <div className="admin-member-inq-header">
                      <div>
                        <strong>{inq.subject}</strong>
                        <span className="admin-member-inq-from"> — {inq.member_name} ({inq.member_email})</span>
                      </div>
                      <span className={`admin-member-inq-status status-${inq.status}`}>{inq.status}</span>
                    </div>
                    <p className="admin-member-inq-body">{inq.message}</p>
                    <p className="admin-member-inq-date">
                      {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {inq.reply ? (
                      <div className="admin-member-inq-reply">
                        <strong>Your reply:</strong> {inq.reply}
                      </div>
                    ) : (
                      replyingId === inq.id ? (
                        <div className="admin-reply-form">
                          <textarea
                            className="form-input form-textarea"
                            rows={3}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Type your reply…"
                            autoFocus
                          />
                          <div className="admin-reply-actions">
                            <button className="btn" onClick={() => submitReply(inq.id)} disabled={replySaving}>
                              {replySaving ? 'Sending…' : 'Send Reply'}
                            </button>
                            <button className="admin-btn-sm" onClick={() => { setReplyingId(null); setReplyText('') }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="admin-btn-sm"
                          onClick={() => { setReplyingId(inq.id); setReplyText('') }}
                        >
                          Reply
                        </button>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
