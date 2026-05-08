'use client'
import { useEffect, useState } from 'react'
import type { PaymentRequest } from '@/lib/types'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

function StatusBadge({ status }: { status: PaymentRequest['status'] }) {
  const cls = status === 'paid' ? 'payment-badge-paid' : status === 'cancelled' ? 'payment-badge-cancelled' : 'payment-badge-pending'
  return <span className={`payment-badge ${cls}`}>{status}</span>
}

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState('')

  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [creating, setCreating] = useState(false)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    fetch('/api/admin/payments').then(r => r.json()).then(d => {
      setPayments(d.payments ?? [])
      setLoading(false)
    })
  }, [])

  async function createPayment() {
    if (!desc || !amount || Number(amount) <= 0) return
    setCreating(true)
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, amountDollars: Number(amount), clientName: clientName || undefined, clientEmail: clientEmail || undefined }),
    })
    const { token } = await res.json()
    const fresh = await fetch('/api/admin/payments').then(r => r.json())
    setPayments(fresh.payments ?? [])
    setShowCreate(false)
    setDesc(''); setAmount(''); setClientName(''); setClientEmail('')
    setCreating(false)
    showToast('Payment request created')
    copyLink(token)
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${siteUrl}/pay/${token}`)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function deletePayment(id: string) {
    if (!confirm('Delete this payment request?')) return
    await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' })
    setPayments(prev => prev.filter(p => p.id !== id))
    showToast('Deleted')
  }

  if (loading) return <div className="admin-loading">Loading…</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Payments</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
          + New Request
        </button>
      </div>

      {payments.length === 0 && (
        <p className="admin-empty">No payment requests yet. Create one and send the link to your client.</p>
      )}

      <div className="payment-list">
        {payments.map(p => (
          <div key={p.id} className="payment-row">
            <div className="payment-row-main">
              <div>
                <p className="payment-description">{p.description}</p>
                {p.client_name && <p className="payment-client">{p.client_name}{p.client_email ? ` · ${p.client_email}` : ''}</p>}
                <p className="payment-meta">
                  {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {p.paid_at && ` · Paid ${new Date(p.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
              <div className="payment-row-right">
                <span className="payment-amount">{fmt(p.amount, p.currency)}</span>
                <StatusBadge status={p.status} />
              </div>
            </div>
            {p.status === 'pending' && (
              <div className="payment-row-actions">
                <button className="admin-btn admin-btn-sm" onClick={() => copyLink(p.token)}>
                  {copiedId === p.token ? '✓ Copied' : 'Copy Link'}
                </button>
                <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deletePayment(p.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">New Payment Request</h3>
            <div className="admin-field">
              <label className="admin-label">Description *</label>
              <input className="admin-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. 50% deposit — Smith wedding florals" />
            </div>
            <div className="admin-field">
              <label className="admin-label">Amount (USD) *</label>
              <input className="admin-input" type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500.00" />
            </div>
            <div className="admin-field">
              <label className="admin-label">Client Name</label>
              <input className="admin-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="admin-field">
              <label className="admin-label">Client Email (for Stripe receipt)</label>
              <input className="admin-input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={createPayment} disabled={creating || !desc || !amount}>
                {creating ? 'Creating…' : 'Create & Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}
