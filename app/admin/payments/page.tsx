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

// ─── Stripe Settings ──────────────────────────────────────────────────────────

function StripeSettings() {
  const [status, setStatus] = useState<{ connected: boolean; publishableKey?: string; secretKeyMasked?: string; hasWebhookSecret?: boolean } | null>(null)
  const [editing, setEditing] = useState(false)
  const [pk, setPk] = useState('')
  const [sk, setSk] = useState('')
  const [wh, setWh] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    fetch('/api/admin/stripe').then(r => r.json()).then(setStatus)
  }, [])

  async function save() {
    setSaving(true); setErr('')
    const res = await fetch('/api/admin/stripe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishableKey: pk, secretKey: sk, webhookSecret: wh }),
    })
    const data = await res.json()
    if (!res.ok) { setErr(data.error); setSaving(false); return }
    const fresh = await fetch('/api/admin/stripe').then(r => r.json())
    setStatus(fresh)
    setEditing(false); setPk(''); setSk(''); setWh('')
    setSaving(false); showToast('Stripe account saved')
  }

  if (!status) return <div className="admin-loading">Loading…</div>

  return (
    <div className="stripe-settings-card">
      <div className="stripe-settings-header">
        <div>
          <h3 className="admin-subsection-title" style={{ margin: 0 }}>Stripe Account</h3>
          <p className="stripe-settings-sub">
            {status.connected ? 'Connected — payments are active.' : 'Not connected — add your Stripe keys to accept payments.'}
          </p>
        </div>
        <div className="stripe-status-dot-wrap">
          <span className={`stripe-status-dot ${status.connected ? 'connected' : ''}`} />
          <span className="stripe-status-label">{status.connected ? 'Connected' : 'Not connected'}</span>
        </div>
      </div>

      {status.connected && !editing && (
        <div className="stripe-keys-display">
          <div className="stripe-key-row">
            <span className="stripe-key-label">Publishable key</span>
            <code className="stripe-key-value">{status.publishableKey}</code>
          </div>
          <div className="stripe-key-row">
            <span className="stripe-key-label">Secret key</span>
            <code className="stripe-key-value">{status.secretKeyMasked}</code>
          </div>
          <div className="stripe-key-row">
            <span className="stripe-key-label">Webhook secret</span>
            <code className="stripe-key-value">{status.hasWebhookSecret ? '••••••••' : '—'}</code>
          </div>
          <button className="admin-btn admin-btn-sm" onClick={() => setEditing(true)} style={{ marginTop: 12 }}>
            Update Keys
          </button>
        </div>
      )}

      {(!status.connected || editing) && (
        <div className="stripe-key-form">
          <div className="admin-field">
            <label className="admin-label">Publishable Key (pk_live_… or pk_test_…)</label>
            <input className="admin-input" value={pk} onChange={e => setPk(e.target.value)} placeholder="pk_live_..." />
          </div>
          <div className="admin-field">
            <label className="admin-label">Secret Key (sk_live_… or sk_test_…)</label>
            <input className="admin-input" type="password" value={sk} onChange={e => setSk(e.target.value)} placeholder="sk_live_..." />
          </div>
          <div className="admin-field">
            <label className="admin-label">Webhook Signing Secret (optional — for payment confirmation)</label>
            <input className="admin-input" type="password" value={wh} onChange={e => setWh(e.target.value)} placeholder="whsec_..." />
          </div>
          {err && <p className="admin-login-error">{err}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {editing && <button className="admin-btn" onClick={() => setEditing(false)}>Cancel</button>}
            <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving || !pk || !sk}>
              {saving ? 'Saving…' : 'Save Stripe Account'}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}

// ─── Payment requests ─────────────────────────────────────────────────────────

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState('')

  // Create form state
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [creating, setCreating] = useState(false)

  // Copy state
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
      </div>

      <StripeSettings />

      <div className="admin-section-header" style={{ marginTop: 40 }}>
        <h3 className="admin-subsection-title" style={{ margin: 0 }}>Payment Requests</h3>
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
                <button
                  className="admin-btn admin-btn-sm"
                  onClick={() => copyLink(p.token)}
                >
                  {copiedId === p.token ? '✓ Copied' : 'Copy Link'}
                </button>
                <button
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  onClick={() => deletePayment(p.id)}
                >
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
