'use client'

import { useEffect, useState } from 'react'
import type { PaymentRequest } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toaster'
import { Plus, Copy, Trash2, Check } from 'lucide-react'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
    toast.success('Payment request created')
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
    toast.success('Deleted')
  }

  const columns: Column<PaymentRequest>[] = [
    {
      key: 'description', header: 'Description',
      render: p => (
        <div>
          <p className="font-medium text-bloom-text">{p.description}</p>
          {p.client_name && <p className="text-xs text-bloom-text-mid">{p.client_name}{p.client_email ? ` · ${p.client_email}` : ''}</p>}
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', render: p => fmt(p.amount, p.currency), sortValue: p => p.amount },
    { key: 'status', header: 'Status', render: p => <StatusBadge status={p.status} /> },
    { key: 'created', header: 'Created', render: p => new Date(p.created_at).toLocaleDateString(), sortValue: p => p.created_at },
    {
      key: 'actions', header: '', className: 'text-right',
      render: p => p.status === 'pending' ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => copyLink(p.token)}>
            {copiedId === p.token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedId === p.token ? 'Copied' : 'Copy Link'}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => deletePayment(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="One-off Stripe payment links for deposits and balances."
        action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Request</Button>}
      />

      <DataTable
        columns={columns}
        rows={payments}
        loading={loading}
        rowKey={p => p.id}
        emptyTitle="No payment requests yet"
        emptyDescription="Create one and send the link to your client."
      />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Payment Request">
        <div className="space-y-3">
          <Input placeholder="Description *" value={desc} onChange={e => setDesc(e.target.value)} />
          <Input type="number" min="1" step="0.01" placeholder="Amount (USD) *" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input placeholder="Client name" value={clientName} onChange={e => setClientName(e.target.value)} />
          <Input type="email" placeholder="Client email (for Stripe receipt)" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createPayment} disabled={creating || !desc || !amount}>{creating ? 'Creating…' : 'Create & Copy Link'}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
