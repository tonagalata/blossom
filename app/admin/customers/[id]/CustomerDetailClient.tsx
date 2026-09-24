'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Customer, Proposal, Invoice } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { FileSignature, Receipt, Trash2 } from 'lucide-react'

function fmtMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export default function CustomerDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', address: '', notes: '' })

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/customers/${id}`)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setCustomer(data.customer)
    setProposals(data.proposals ?? [])
    setInvoices(data.invoices ?? [])
    setForm({
      firstName: data.customer.first_name ?? '', lastName: data.customer.last_name ?? '',
      email: data.customer.email ?? '', phone: data.customer.phone ?? '',
      company: data.customer.company ?? '', address: data.customer.address ?? '', notes: data.customer.notes ?? '',
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) { toast.success('Saved'); load() } else { toast.error('Failed to save') }
  }

  async function handleDelete() {
    if (!confirm('Delete this customer? This cannot be undone.')) return
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Customer deleted'); router.push('/admin/customers') } else { toast.error('Failed to delete') }
  }

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>
  }

  if (!customer) {
    return <EmptyState title="Customer not found" />
  }

  return (
    <div>
      <PageHeader
        title={[customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email}
        description={customer.company ?? undefined}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/proposals/new?customerId=${id}`}><Button variant="outline"><FileSignature className="h-4 w-4" /> New Proposal</Button></Link>
            <Link href={`/admin/invoices/new?customerId=${id}`}><Button><Receipt className="h-4 w-4" /> New Invoice</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Proposals</CardTitle></CardHeader>
            <CardContent>
              {proposals.length === 0 ? <p className="text-sm text-bloom-text-mid">No proposals yet.</p> : (
                <ul className="divide-y divide-bloom-border">
                  {proposals.map(p => (
                    <li key={p.id}>
                      <Link href={`/admin/proposals/${p.id}`} className="flex items-center justify-between py-2 text-sm hover:text-bloom-gold">
                        <span>{p.title}</span>
                        <span className="flex items-center gap-3"><StatusBadge status={p.status} /><span>{fmtMoney(p.total, p.currency)}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? <p className="text-sm text-bloom-text-mid">No invoices yet.</p> : (
                <ul className="divide-y divide-bloom-border">
                  {invoices.map(inv => (
                    <li key={inv.id}>
                      <Link href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between py-2 text-sm hover:text-bloom-gold">
                        <span>{inv.invoice_number}</span>
                        <span className="flex items-center gap-3"><StatusBadge status={inv.status} /><span>{fmtMoney(inv.total, inv.currency)}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {customer.inquiry_id && (
            <Card>
              <CardHeader><CardTitle>Originating Inquiry</CardTitle></CardHeader>
              <CardContent>
                <Link href="/admin/inquiries" className="text-sm text-bloom-gold hover:underline">View in Inquiries →</Link>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                <Input placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              <Input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <div className="flex justify-between pt-2">
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
