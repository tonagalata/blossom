'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Proposal, Customer, ProposalStatus } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Plus } from 'lucide-react'

function fmtMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

const STATUSES: ProposalStatus[] = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']

export default function ProposalsClient() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [customers, setCustomers] = useState<Record<string, Customer>>({})
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('')

  async function load() {
    setLoading(true)
    const [pRes, cRes] = await Promise.all([
      fetch(`/api/admin/proposals${status ? `?status=${status}` : ''}`),
      fetch('/api/admin/customers'),
    ])
    const pData = await pRes.json()
    const cData = await cRes.json()
    setProposals(pData.proposals ?? [])
    setCustomers(Object.fromEntries((cData.customers ?? []).map((c: Customer) => [c.id, c])))
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const columns: Column<Proposal>[] = useMemo(() => [
    { key: 'title', header: 'Title', render: p => <span className="font-medium">{p.title}</span>, sortValue: p => p.title },
    {
      key: 'customer', header: 'Customer',
      render: p => {
        const c = customers[p.customer_id]
        return c ? [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email : '—'
      },
    },
    { key: 'status', header: 'Status', render: p => <StatusBadge status={p.status} /> },
    { key: 'total', header: 'Total', render: p => fmtMoney(p.total, p.currency), sortValue: p => p.total },
    { key: 'updated', header: 'Updated', render: p => new Date(p.updated_at).toLocaleDateString(), sortValue: p => p.updated_at },
  ], [customers])

  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Draft, send and track client proposals."
        action={<Link href="/admin/proposals/new"><Button><Plus className="h-4 w-4" /> New Proposal</Button></Link>}
      />

      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={proposals}
        loading={loading}
        rowKey={p => p.id}
        onRowClick={p => router.push(`/admin/proposals/${p.id}`)}
        emptyTitle="No proposals yet"
        emptyDescription="Create a proposal for a customer to get started."
      />
    </div>
  )
}
