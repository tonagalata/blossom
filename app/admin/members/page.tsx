'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Plus, Users } from 'lucide-react'

interface Plan {
  id: string
  stripe_price_id: string | null
  name: string
  description: string | null
  amount: number
  interval: 'month' | 'year'
  features: string[]
  active: number
  sort_order: number
}

interface Member {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  subscription_status: string | null
  plan_id: string | null
  current_period_end: string | null
}

interface MemberInquiry {
  id: string
  member_id: string
  created_at: string
  subject: string
  message: string
  status: string
  reply: string | null
  member_email: string
  member_name: string
}

const STATUS_BADGE: Record<string, 'success' | 'gold' | 'warning' | 'neutral'> = {
  active: 'success', trialing: 'gold', past_due: 'warning', canceled: 'neutral', incomplete: 'warning',
}

export default function AdminMembersPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [inquiries, setInquiries] = useState<MemberInquiry[]>([])
  const [loading, setLoading] = useState(true)

  const [planForm, setPlanForm] = useState({ name: '', description: '', amountDollars: '', interval: 'month', features: '', sortOrder: '0' })
  const [planSaving, setPlanSaving] = useState(false)
  const [planError, setPlanError] = useState('')
  const [showPlanForm, setShowPlanForm] = useState(false)

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', features: '', sortOrder: '0' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    const [plansRes, membersRes, inquiriesRes] = await Promise.all([
      fetch('/api/admin/plans'),
      fetch('/api/admin/members'),
      fetch('/api/admin/members/inquiries'),
    ])
    if (plansRes.ok) { const d = await plansRes.json(); setPlans(d.plans || []) }
    if (membersRes.ok) { const d = await membersRes.json(); setMembers(d.members || []) }
    if (inquiriesRes.ok) { const d = await inquiriesRes.json(); setInquiries(d.inquiries || []) }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function createPlan(e: React.FormEvent) {
    e.preventDefault()
    setPlanError('')
    setPlanSaving(true)
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          description: planForm.description || undefined,
          amountDollars: parseFloat(planForm.amountDollars),
          interval: planForm.interval,
          features: planForm.features ? planForm.features.split('\n').map(s => s.trim()).filter(Boolean) : [],
          sortOrder: parseInt(planForm.sortOrder) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPlanError(data.error || 'Failed to create plan'); return }
      setPlanForm({ name: '', description: '', amountDollars: '', interval: 'month', features: '', sortOrder: '0' })
      setShowPlanForm(false)
      await loadAll()
    } catch {
      setPlanError('Something went wrong.')
    } finally {
      setPlanSaving(false)
    }
  }

  function startEdit(plan: Plan) {
    setEditingPlanId(plan.id)
    setEditError('')
    setEditForm({ name: plan.name, description: plan.description ?? '', features: plan.features.join('\n'), sortOrder: String(plan.sort_order) })
  }

  function cancelEdit() {
    setEditingPlanId(null)
    setEditError('')
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim()) { setEditError('Name is required.'); return }
    setEditError('')
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          features: editForm.features ? editForm.features.split('\n').map(s => s.trim()).filter(Boolean) : [],
          sort_order: parseInt(editForm.sortOrder) || 0,
        }),
      })
      if (!res.ok) { setEditError('Failed to save changes.'); return }
      setEditingPlanId(null)
      await loadAll()
    } catch {
      setEditError('Something went wrong.')
    } finally {
      setEditSaving(false)
    }
  }

  async function togglePlanActive(plan: Plan) {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !plan.active }),
    })
    await loadAll()
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan? Members already subscribed will not be affected.')) return
    await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    await loadAll()
  }

  async function submitReply(id: string) {
    if (!replyText.trim()) return
    setReplySaving(true)
    try {
      await fetch(`/api/admin/members/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      })
      setReplyingId(null)
      setReplyText('')
      await loadAll()
    } finally {
      setReplySaving(false)
    }
  }

  const memberColumns: Column<Member>[] = [
    {
      key: 'name', header: 'Name / Email',
      render: m => (
        <div>
          <p className="font-medium text-bloom-text">{[m.first_name, m.last_name].filter(Boolean).join(' ') || '—'}</p>
          <p className="text-xs text-bloom-text-mid">{m.email}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: m => m.subscription_status ? <Badge variant={STATUS_BADGE[m.subscription_status] ?? 'neutral'}>{m.subscription_status}</Badge> : '—' },
    { key: 'renews', header: 'Renews', render: m => m.current_period_end ? new Date(m.current_period_end).toLocaleDateString() : '—' },
    { key: 'joined', header: 'Joined', render: m => new Date(m.created_at).toLocaleDateString(), sortValue: m => m.created_at },
  ]

  const openInquiries = inquiries.filter(i => i.status === 'open').length

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>

  return (
    <div>
      <PageHeader title="Members" description="Membership plans, active members, and member support inquiries." />

      <Tabs defaultValue="plans">
        <TabsList className="mb-6">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries {openInquiries > 0 && `(${openInquiries})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowPlanForm(f => !f)}>
              <Plus className="h-4 w-4" /> {showPlanForm ? 'Cancel' : 'New Plan'}
            </Button>
          </div>

          {showPlanForm && (
            <Card className="mb-6">
              <CardContent>
                <form onSubmit={createPlan} className="space-y-3">
                  {planError && <p className="text-sm text-red-600">{planError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Name" value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} required />
                    <Input type="number" step="0.01" min="0.50" placeholder="Price (USD)" value={planForm.amountDollars} onChange={e => setPlanForm(f => ({ ...f, amountDollars: e.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={planForm.interval} onChange={e => setPlanForm(f => ({ ...f, interval: e.target.value }))}>
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </Select>
                    <Input type="number" placeholder="Sort order" value={planForm.sortOrder} onChange={e => setPlanForm(f => ({ ...f, sortOrder: e.target.value }))} />
                  </div>
                  <Input placeholder="Description" value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} />
                  <Textarea rows={4} placeholder="Features (one per line)" value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} />
                  <Button type="submit" disabled={planSaving}>{planSaving ? 'Creating…' : 'Create Plan'}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {plans.length === 0 ? (
            <EmptyState title="No plans yet" description="Create one above." />
          ) : (
            <div className="space-y-3">
              {plans.map(plan => (
                <Card key={plan.id} className={plan.active ? undefined : 'opacity-60'}>
                  <CardContent>
                    {editingPlanId === plan.id ? (
                      <div className="space-y-3">
                        {editError && <p className="text-sm text-red-600">{editError}</p>}
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                          <Input type="number" placeholder="Sort order" value={editForm.sortOrder} onChange={e => setEditForm(f => ({ ...f, sortOrder: e.target.value }))} />
                        </div>
                        <Input placeholder="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                        <Textarea rows={4} placeholder="Features (one per line)" value={editForm.features} onChange={e => setEditForm(f => ({ ...f, features: e.target.value }))} />
                        <p className="text-xs text-bloom-text-light">
                          ${(plan.amount / 100).toFixed(2)}/{plan.interval} — price &amp; interval can&apos;t be changed here since they&apos;re tied to Stripe; delete and recreate the plan to change them.
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={() => saveEdit(plan.id)} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</Button>
                          <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-bloom-text">{plan.name}</strong>
                              {!plan.active && <Badge variant="neutral">Inactive</Badge>}
                            </div>
                            <p className="text-sm text-bloom-text-mid">${(plan.amount / 100).toFixed(2)}/{plan.interval}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEdit(plan)}>Edit</Button>
                            <Button variant="outline" size="sm" onClick={() => togglePlanActive(plan)}>{plan.active ? 'Deactivate' : 'Activate'}</Button>
                            <Button variant="destructive" size="sm" onClick={() => deletePlan(plan.id)}>Delete</Button>
                          </div>
                        </div>
                        {plan.description && <p className="mt-2 text-sm text-bloom-text-mid">{plan.description}</p>}
                        {plan.features.length > 0 && (
                          <ul className="mt-2 space-y-1 text-sm text-bloom-text">
                            {plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                          </ul>
                        )}
                        {plan.stripe_price_id && <p className="mt-2 text-xs text-bloom-text-light">Stripe: {plan.stripe_price_id}</p>}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members">
          <DataTable columns={memberColumns} rows={members} rowKey={m => m.id} emptyTitle="No members yet" />
        </TabsContent>

        <TabsContent value="inquiries">
          {inquiries.length === 0 ? (
            <EmptyState icon={Users} title="No inquiries yet" />
          ) : (
            <div className="space-y-3">
              {inquiries.map(inq => (
                <Card key={inq.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <strong className="text-bloom-text">{inq.subject}</strong>
                        <span className="text-sm text-bloom-text-mid"> — {inq.member_name} ({inq.member_email})</span>
                      </div>
                      <Badge variant={inq.status === 'open' ? 'gold' : 'neutral'}>{inq.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-bloom-text">{inq.message}</p>
                    <p className="mt-1 text-xs text-bloom-text-light">{new Date(inq.created_at).toLocaleDateString()}</p>
                    {inq.reply ? (
                      <div className="mt-3 rounded-md bg-bloom-bg px-3 py-2 text-sm text-bloom-text">
                        <strong>Your reply:</strong> {inq.reply}
                      </div>
                    ) : replyingId === inq.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea rows={3} placeholder="Type your reply…" value={replyText} onChange={e => setReplyText(e.target.value)} autoFocus />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => submitReply(inq.id)} disabled={replySaving}>{replySaving ? 'Sending…' : 'Send Reply'}</Button>
                          <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReplyText('') }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => { setReplyingId(inq.id); setReplyText('') }}>Reply</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
