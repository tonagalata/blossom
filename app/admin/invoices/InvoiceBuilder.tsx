'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Customer, LineItem, Invoice } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { LineItemsEditor } from '@/components/admin/LineItemsEditor'
import { toast } from '@/components/ui/Toaster'
import { blankLineItem } from '@/lib/lineItems'
import { Send, DollarSign, Trash2, Download } from 'lucide-react'

function fmtMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function InvoiceBuilder({ id, initialCustomerId }: { id?: string; initialCustomerId?: string }) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')

  const [customerId, setCustomerId] = useState(initialCustomerId ?? '')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [lineItems, setLineItems] = useState<LineItem[]>([blankLineItem()])

  useEffect(() => {
    fetch('/api/admin/customers').then(r => r.json()).then(d => setCustomers(d.customers ?? []))
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/invoices/${id}`).then(r => r.json()).then(d => {
      const inv: Invoice = d.invoice
      setInvoice(inv)
      setCustomerId(inv.customer_id)
      setIssueDate(inv.issue_date?.slice(0, 10) ?? '')
      setDueDate(inv.due_date?.slice(0, 10) ?? '')
      setNotes(inv.notes ?? '')
      setTerms(inv.terms ?? '')
      setTaxRate(inv.tax_rate)
      setLineItems(inv.line_items.length ? inv.line_items : [blankLineItem()])
      setLoading(false)
    })
  }, [id])

  async function save(send = false) {
    if (!customerId || !lineItems.some(i => i.title)) {
      toast.error('Customer and at least one line item are required.')
      return
    }
    setSaving(true)
    const res = id
      ? await fetch(`/api/admin/invoices/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueDate: issueDate || null, dueDate: dueDate || null, notes: notes || null, terms: terms || null, taxRate, lineItems, send }),
        })
      : await fetch('/api/admin/invoices', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, issueDate: issueDate || null, dueDate: dueDate || null, notes: notes || null, terms: terms || null, taxRate, lineItems }),
        })
    setSaving(false)
    if (res.ok) {
      toast.success(send ? 'Invoice sent' : 'Invoice saved')
      const data = await res.json()
      router.push(`/admin/invoices/${id ?? data.id}`)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to save invoice')
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    const cents = Math.round((parseFloat(paymentAmount) || 0) * 100)
    if (cents <= 0) return
    const res = await fetch(`/api/admin/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordPaymentCents: cents }),
    })
    if (res.ok) {
      toast.success('Payment recorded')
      setPaymentDialogOpen(false)
      setPaymentAmount('')
      const data = await fetch(`/api/admin/invoices/${id}`).then(r => r.json())
      setInvoice(data.invoice)
    } else {
      toast.error('Failed to record payment')
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this invoice?')) return
    const res = await fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' })
    if (res.ok) { router.push('/admin/invoices') } else { toast.error('Failed to delete') }
  }

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>

  return (
    <div>
      <PageHeader
        title={id ? invoice?.invoice_number || 'Invoice' : 'New Invoice'}
        description={invoice ? <StatusBadge status={invoice.status} /> : undefined}
        action={
          <div className="flex gap-2">
            {id && invoice && invoice.payment_request_token && (
              <a href={`/invoice/${invoice.token}`} target="_blank" rel="noreferrer">
                <Button variant="outline">View Public Page</Button>
              </a>
            )}
            {id && (
              <a href={`/api/admin/invoices/${id}/pdf`} target="_blank" rel="noreferrer">
                <Button variant="outline"><Download className="h-4 w-4" /> PDF</Button>
              </a>
            )}
            {id && <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}><DollarSign className="h-4 w-4" /> Record Payment</Button>}
            {id && <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>}
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>Save Draft</Button>
            <Button onClick={() => save(true)} disabled={saving}><Send className="h-4 w-4" /> Send</Button>
          </div>
        }
      />

      {invoice && invoice.amount_paid > 0 && (
        <div className="mb-4 rounded-md border border-bloom-sage/40 bg-bloom-sage/10 px-4 py-2 text-sm text-bloom-text">
          {fmtMoney(invoice.amount_paid, invoice.currency)} paid of {fmtMoney(invoice.total, invoice.currency)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
            <CardContent>
              <LineItemsEditor items={lineItems} onChange={setLineItems} taxRate={taxRate} onTaxRateChange={setTaxRate} currency={invoice?.currency ?? 'usd'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes & Terms</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Notes for the client" value={notes} onChange={e => setNotes(e.target.value)} />
              <Textarea placeholder="Terms & conditions (client must sign if provided)" value={terms} onChange={e => setTerms(e.target.value)} />
            </CardContent>
          </Card>

          {invoice?.signature && (
            <Card>
              <CardHeader><CardTitle>Signature</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-bloom-text">{invoice.signature.signer_name} ({invoice.signature.signer_email})</p>
                <p className="text-xs text-bloom-text-light">Signed {new Date(invoice.signature.signed_at).toLocaleString()}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={invoice.signature.signature_data} alt="Signature" className="mt-2 h-16 border border-bloom-border bg-white" />
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Customer</label>
              <Select value={customerId} onChange={e => setCustomerId(e.target.value)} disabled={!!id}>
                <option value="">Select a customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}</option>
                ))}
              </Select>
              {!customers.length && <p className="mt-1 text-xs text-bloom-text-light">No customers yet — <Link href="/admin/customers" className="underline">add one first</Link>.</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Issue date</label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Due date</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} title="Record Manual Payment">
        <form onSubmit={handleRecordPayment} className="space-y-3">
          <Input type="number" min={0} step="0.01" placeholder="Amount received" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} autoFocus />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
