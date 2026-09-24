import { getBusinessDashboardStats, listInquiries, listProposals, listInvoices } from '@/lib/db'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Inbox, FileSignature, Receipt, Users, Activity } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'usd' }).format(cents / 100)
}

interface ActivityItem {
  id: string
  date: string
  label: string
  status: string
  href: string
}

export default async function AdminDashboard() {
  const [stats, inquiries, proposals, invoices] = await Promise.all([
    getBusinessDashboardStats(),
    listInquiries(),
    listProposals(),
    listInvoices(),
  ])

  const activity: ActivityItem[] = [
    ...inquiries.slice(0, 5).map(i => ({
      id: i.id, date: i.created_at, href: '/admin/inquiries',
      label: `Inquiry from ${[i.first_name, i.last_name].filter(Boolean).join(' ') || i.email}`,
      status: i.read ? 'read' : 'pending',
    })),
    ...proposals.slice(0, 5).map(p => ({ id: p.id, date: p.updated_at, href: `/admin/proposals/${p.id}`, label: `Proposal: ${p.title}`, status: p.status })),
    ...invoices.slice(0, 5).map(inv => ({ id: inv.id, date: inv.updated_at, href: `/admin/invoices/${inv.id}`, label: `Invoice ${inv.invoice_number}`, status: inv.status })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8)

  return (
    <div>
      <PageHeader title="Dashboard" description="An overview of inquiries, proposals, invoices and members." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Inquiries" value={String(stats.openInquiries)} icon={Inbox} />
        <StatCard label="Outstanding Invoices" value={fmtMoney(stats.outstandingInvoiceTotal)} icon={Receipt} />
        <StatCard label="Pending Proposals" value={String(stats.pendingProposals)} icon={FileSignature} />
        <StatCard label="Active Members" value={String(stats.activeMembers)} icon={Users} hint={`${fmtMoney(stats.mrr)} MRR`} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-bloom-gold" />
          <h2 className="text-sm font-semibold text-bloom-text">Recent Activity</h2>
        </div>
        {activity.length === 0 ? (
          <EmptyState title="No activity yet" description="Inquiries, proposals and invoices will show up here." />
        ) : (
          <div className="rounded-lg border border-bloom-border bg-white">
            {activity.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-bloom-bg/40 ${i !== activity.length - 1 ? 'border-b border-bloom-border' : ''}`}
              >
                <span className="text-bloom-text">{item.label}</span>
                <span className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-bloom-text-light">{new Date(item.date).toLocaleDateString()}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
