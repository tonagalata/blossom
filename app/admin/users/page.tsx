'use client'

import { useEffect, useState } from 'react'
import type { AdminUser } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { toast } from '@/components/ui/Toaster'
import { UserPlus, Ban, CheckCircle2, Trash2 } from 'lucide-react'

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    })
    setInviting(false)
    if (res.ok) {
      toast.success('Admin invited — they can sign in with Google or create a password using that email.')
      setOpen(false)
      setEmail('')
      setDisplayName('')
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to invite admin')
    }
  }

  async function toggleDisabled(user: AdminUser) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !user.disabled }),
    })
    if (res.ok) {
      toast.success(user.disabled ? 'Admin re-enabled' : 'Admin disabled')
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to update admin')
    }
  }

  async function handleRemove(user: AdminUser) {
    if (!confirm(`Remove ${user.email} as an admin? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Admin removed')
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Failed to remove admin')
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'name', header: 'Admin',
      render: u => (
        <div>
          <p className="font-medium text-bloom-text">{u.display_name || u.email}</p>
          {u.display_name && <p className="text-xs text-bloom-text-mid">{u.email}</p>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: u => <Badge variant={u.disabled ? 'danger' : 'success'}>{u.disabled ? 'Disabled' : 'Active'}</Badge> },
    { key: 'last_login', header: 'Last Login', render: u => u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never', sortValue: u => u.last_login_at ?? '' },
    { key: 'created', header: 'Added', render: u => new Date(u.created_at).toLocaleDateString(), sortValue: u => u.created_at },
    {
      key: 'actions', header: '', className: 'text-right',
      render: u => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleDisabled(u)}>
            {u.disabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
            {u.disabled ? 'Enable' : 'Disable'}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleRemove(u)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage who has admin access to this dashboard."
        action={<Button onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" /> Invite Admin</Button>}
      />

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        rowKey={u => u.id}
        emptyTitle="No admins yet"
      />

      <Dialog open={open} onClose={() => setOpen(false)} title="Invite Admin" description="They can sign in with Google, or create a password the first time they sign in — either way, using this email.">
        <form onSubmit={handleInvite} className="space-y-3">
          <Input type="email" placeholder="Email *" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={inviting || !email}>{inviting ? 'Sending…' : 'Send Invite'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
