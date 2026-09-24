'use client'

import { useEffect, useState } from 'react'
import type { Inquiry } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toaster'
import { ChevronDown, ChevronUp, Mail, Trash2, Inbox, FileText } from 'lucide-react'

const BUDGET_LABELS: Record<string, string> = {
  'under-2k': 'Under $2,000',
  '2-5k': '$2,000 – $5,000',
  '5-10k': '$5,000 – $10,000',
  '10-20k': '$10,000 – $20,000',
  '20k+': '$20,000+',
}

const EVENT_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement Party',
  birthday: 'Birthday Celebration',
  'baby-shower': 'Baby Shower',
  'bridal-shower': 'Bridal Shower',
  corporate: 'Corporate Event',
  gala: 'Gala or Fundraiser',
  other: 'Other',
}

export default function InquiriesAdmin() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/inquiries')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInquiries(data.inquiries)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load'); setLoading(false) })
  }, [])

  async function toggleExpand(id: string, isRead: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (!isRead) {
      await fetch(`/api/admin/inquiries/${id}`, { method: 'PATCH' })
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, read: 1 } : i))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this inquiry?')) return
    await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' })
    setInquiries(prev => prev.filter(i => i.id !== id))
    toast.success('Inquiry deleted')
  }

  const unread = inquiries.filter(i => !i.read).length

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description={unread > 0 ? `${unread} unread` : 'All caught up.'}
      />

      {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : inquiries.length === 0 && !error ? (
        <EmptyState icon={Inbox} title="No inquiries yet" />
      ) : (
        <div className="space-y-2">
          {inquiries.map(inq => {
            const open = expanded.has(inq.id)
            const name = [inq.first_name, inq.last_name].filter(Boolean).join(' ') || '—'
            const date = new Date(inq.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

            return (
              <div key={inq.id} className={`rounded-lg border bg-white ${!inq.read ? 'border-bloom-gold/50' : 'border-bloom-border'}`}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                  onClick={() => toggleExpand(inq.id, inq.read)}
                >
                  <div className="flex items-center gap-3">
                    {!inq.read && <span className="h-2 w-2 shrink-0 rounded-full bg-bloom-gold" />}
                    <div>
                      <p className="text-sm font-semibold text-bloom-text">{name}</p>
                      <a href={`mailto:${inq.email}`} className="text-xs text-bloom-text-mid hover:text-bloom-gold" onClick={e => e.stopPropagation()}>
                        {inq.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-bloom-text-mid">
                    {inq.event_type && <Badge variant="neutral">{EVENT_LABELS[inq.event_type] ?? inq.event_type}</Badge>}
                    {inq.event_date && <span>{inq.event_date}</span>}
                    <time>{date}</time>
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {open && (
                  <div className="border-t border-bloom-border px-4 py-4">
                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      {inq.phone && <div><dt className="text-xs text-bloom-text-light">Phone</dt><dd className="text-bloom-text">{inq.phone}</dd></div>}
                      {inq.guest_count && <div><dt className="text-xs text-bloom-text-light">Guests</dt><dd className="text-bloom-text">{inq.guest_count}</dd></div>}
                      {inq.venue && <div><dt className="text-xs text-bloom-text-light">Venue</dt><dd className="text-bloom-text">{inq.venue}</dd></div>}
                      {inq.budget && <div><dt className="text-xs text-bloom-text-light">Budget</dt><dd className="text-bloom-text">{BUDGET_LABELS[inq.budget] ?? inq.budget}</dd></div>}
                      {inq.color_palette && <div><dt className="text-xs text-bloom-text-light">Palette</dt><dd className="text-bloom-text">{inq.color_palette}</dd></div>}
                      {inq.message && <div className="col-span-full"><dt className="text-xs text-bloom-text-light">Message</dt><dd className="whitespace-pre-wrap text-bloom-text">{inq.message}</dd></div>}
                    </dl>

                    {inq.attachments.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-bloom-text-light">Attachments</p>
                        <div className="flex flex-wrap gap-3">
                          {inq.attachments.map(att => (
                            <a key={att.id} href={att.storage_url} target="_blank" rel="noopener noreferrer" download={att.filename} className="flex flex-col items-center gap-1 text-xs text-bloom-text-mid">
                              {att.content_type.startsWith('image/') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={att.storage_url} alt={att.filename} className="h-16 w-16 rounded-md border border-bloom-border object-cover" />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-bloom-border bg-bloom-bg">
                                  <FileText className="h-5 w-5 text-bloom-text-light" />
                                </div>
                              )}
                              <span className="max-w-[64px] truncate">{att.filename}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <a href={`mailto:${inq.email}`}><Button size="sm"><Mail className="h-3.5 w-3.5" /> Reply</Button></a>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(inq.id)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
