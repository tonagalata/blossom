'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Customer } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog } from '@/components/ui/Dialog'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { toast } from '@/components/ui/Toaster'
import { Plus } from 'lucide-react'

export default function CustomersClient() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', address: '', notes: '' })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/customers')
    const data = await res.json()
    setCustomers(data.customers ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q)
    )
  }, [customers, search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Customer created')
      setOpen(false)
      setForm({ firstName: '', lastName: '', email: '', phone: '', company: '', address: '', notes: '' })
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to create customer')
    }
  }

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Name', render: c => <span className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</span>, sortValue: c => `${c.first_name ?? ''} ${c.last_name ?? ''}` },
    { key: 'email', header: 'Email', render: c => c.email, sortValue: c => c.email },
    { key: 'company', header: 'Company', render: c => c.company ?? '—' },
    { key: 'source', header: 'Source', render: c => c.source },
    { key: 'created', header: 'Added', render: c => new Date(c.created_at).toLocaleDateString(), sortValue: c => c.created_at },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone you've quoted, invoiced or worked with."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Customer</Button>}
      />

      <div className="mb-4 max-w-xs">
        <Input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        rowKey={c => c.id}
        onRowClick={c => router.push(`/admin/customers/${c.id}`)}
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to start building proposals and invoices."
      />

      <Dialog open={open} onClose={() => setOpen(false)} title="New Customer">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <Input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Customer'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
