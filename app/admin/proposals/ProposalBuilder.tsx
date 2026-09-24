'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Customer, LineItem, Proposal } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { LineItemsEditor } from '@/components/admin/LineItemsEditor'
import { toast } from '@/components/ui/Toaster'
import { blankLineItem } from '@/lib/lineItems'
import { Send, Eye, Receipt, Trash2, Download } from 'lucide-react'

function fmtMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function ProposalBuilder({ id, initialCustomerId }: { id?: string; initialCustomerId?: string }) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)

  const [customerId, setCustomerId] = useState(initialCustomerId ?? '')
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [depositPercentage, setDepositPercentage] = useState(0)
  const [lineItems, setLineItems] = useState<LineItem[]>([blankLineItem()])

  useEffect(() => {
    fetch('/api/admin/customers').then(r => r.json()).then(d => setCustomers(d.customers ?? []))
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/proposals/${id}`).then(r => r.json()).then(d => {
      const p: Proposal = d.proposal
      setProposal(p)
      setCustomerId(p.customer_id)
      setTitle(p.title)
      setEventDate(p.event_date?.slice(0, 10) ?? '')
      setValidUntil(p.valid_until?.slice(0, 10) ?? '')
      setNotes(p.notes ?? '')
      setTerms(p.terms ?? '')
      setTaxRate(p.tax_rate)
      setDepositPercentage(p.deposit_percentage)
      setLineItems(p.line_items.length ? p.line_items : [blankLineItem()])
      setLoading(false)
    })
  }, [id])

  async function save(send = false) {
    if (!customerId || !title || !lineItems.some(i => i.title)) {
      toast.error('Customer, title and at least one line item are required.')
      return
    }
    setSaving(true)
    const payload = {
      customerId, title, eventDate: eventDate || null, validUntil: validUntil || null,
      notes: notes || null, terms: terms || null, taxRate, depositPercentage, lineItems, send,
    }
    const res = id
      ? await fetch(`/api/admin/proposals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) {
      toast.success(send ? 'Proposal sent' : 'Proposal saved')
      const data = await res.json()
      router.push(`/admin/proposals/${id ?? data.id}`)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to save proposal')
    }
  }

  async function handleConvert() {
    if (!id) return
    const res = await fetch(`/api/admin/proposals/${id}/convert`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      toast.success('Converted to invoice')
      router.push(`/admin/invoices/${data.id}`)
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to convert')
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this proposal?')) return
    const res = await fetch(`/api/admin/proposals/${id}`, { method: 'DELETE' })
    if (res.ok) { router.push('/admin/proposals') } else { toast.error('Failed to delete') }
  }

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>

  return (
    <div>
      <PageHeader
        title={id ? proposal?.title || 'Proposal' : 'New Proposal'}
        description={proposal ? <StatusBadge status={proposal.status} /> : undefined}
        action={
          <div className="flex gap-2">
            {id && proposal && (
              <a href={`/proposal/${proposal.token}`} target="_blank" rel="noreferrer">
                <Button variant="outline"><Eye className="h-4 w-4" /> Preview as Client</Button>
              </a>
            )}
            {id && (
              <a href={`/api/admin/proposals/${id}/pdf`} target="_blank" rel="noreferrer">
                <Button variant="outline"><Download className="h-4 w-4" /> PDF</Button>
              </a>
            )}
            {id && proposal?.status === 'accepted' && (
              <Button variant="outline" onClick={handleConvert}><Receipt className="h-4 w-4" /> Convert to Invoice</Button>
            )}
            {id && <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>}
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>Save Draft</Button>
            <Button onClick={() => save(true)} disabled={saving}><Send className="h-4 w-4" /> Send</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent>
              <LineItemsEditor items={lineItems} onChange={setLineItems} taxRate={taxRate} onTaxRateChange={setTaxRate} currency={proposal?.currency ?? 'usd'} allowImages />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes & Terms</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Notes for the client" value={notes} onChange={e => setNotes(e.target.value)} />
              <Textarea placeholder="Terms & conditions" value={terms} onChange={e => setTerms(e.target.value)} />
            </CardContent>
          </Card>

          {proposal?.signature && (
            <Card>
              <CardHeader><CardTitle>Signature</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-bloom-text">{proposal.signature.signer_name} ({proposal.signature.signer_email})</p>
                <p className="text-xs text-bloom-text-light">Signed {new Date(proposal.signature.signed_at).toLocaleString()}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proposal.signature.signature_data} alt="Signature" className="mt-2 h-16 border border-bloom-border bg-white" />
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Customer</label>
              <Select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Select a customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}</option>
                ))}
              </Select>
              {!customers.length && <p className="mt-1 text-xs text-bloom-text-light">No customers yet — <Link href="/admin/customers" className="underline">add one first</Link>.</p>}
            </div>
            <Input placeholder="Proposal title" value={title} onChange={e => setTitle(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Event date</label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Valid until</label>
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Upfront deposit (%)</label>
              <Input
                type="number" min={0} max={100} step="1"
                value={Math.round(depositPercentage * 100)}
                onChange={e => setDepositPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) / 100)}
                placeholder="e.g. 50"
              />
              <p className="mt-1 text-xs text-bloom-text-light">
                If set, a live Stripe payment link for this percentage of the total becomes available once the client signs.
              </p>
            </div>
          </CardContent>
        </Card>

        {proposal && proposal.deposit_percentage > 0 && (
          <Card className="h-fit lg:col-start-3">
            <CardHeader><CardTitle>Deposit Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-bloom-text-mid">
                {Math.round(proposal.deposit_percentage * 100)}% of {fmtMoney(proposal.total, proposal.currency)} ={' '}
                <span className="font-medium text-bloom-text">{fmtMoney(Math.round(proposal.total * proposal.deposit_percentage), proposal.currency)}</span>
              </p>
              {proposal.deposit_status === 'paid' ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">Paid</span>
              ) : proposal.payment_request_token ? (
                <a href={`/pay/${proposal.payment_request_token}`} target="_blank" rel="noreferrer" className="text-sm text-bloom-gold underline">
                  View payment link
                </a>
              ) : (
                <p className="text-xs text-bloom-text-light">The payment link is created automatically once the client accepts &amp; signs.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
