'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Invoice, Customer, InvoiceStatus } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Plus } from 'lucide-react'

function fmtMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'partial', 'paid', 'overdue', 'void']

export default function InvoicesClient() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Record<string, Customer>>({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('')

  async function load() {
    setLoading(true)
    const [iRes, cRes] = await Promise.all([
      fetch(`/api/admin/invoices${status ? `?status=${status}` : ''}`),
      fetch('/api/admin/customers'),
    ])
    const iData = await iRes.json()
    const cData = await cRes.json()
    setInvoices(iData.invoices ?? [])
    setCustomers(Object.fromEntries((cData.customers ?? []).map((c: Customer) => [c.id, c])))
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const columns: Column<Invoice>[] = useMemo(() => [
    { key: 'number', header: 'Invoice #', render: inv => <span className="font-medium">{inv.invoice_number}</span>, sortValue: inv => inv.invoice_number },
    {
      key: 'customer', header: 'Customer',
      render: inv => {
        const c = customers[inv.customer_id]
        return c ? [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email : '—'
      },
    },
    { key: 'status', header: 'Status', render: inv => <StatusBadge status={inv.status} /> },
    { key: 'total', header: 'Total', render: inv => fmtMoney(inv.total, inv.currency), sortValue: inv => inv.total },
    { key: 'due', header: 'Due', render: inv => inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—', sortValue: inv => inv.due_date ?? '' },
  ], [customers])

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Bill customers and collect payment via Stripe."
        action={<Link href="/admin/invoices/new"><Button><Plus className="h-4 w-4" /> New Invoice</Button></Link>}
      />

      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={invoices}
        loading={loading}
        rowKey={inv => inv.id}
        onRowClick={inv => router.push(`/admin/invoices/${inv.id}`)}
        emptyTitle="No invoices yet"
        emptyDescription="Create an invoice for a customer, or convert an accepted proposal."
      />
    </div>
  )
}
