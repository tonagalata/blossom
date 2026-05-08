'use client'
import { useEffect, useState } from 'react'
import type { Inquiry } from '@/lib/types'

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
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

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
    showToast('Inquiry deleted')
  }

  const unread = inquiries.filter(i => !i.read).length

  if (loading) return <div className="admin-loading">Loading…</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          Inquiries
          {unread > 0 && <span className="admin-badge" style={{ marginLeft: 12 }}>{unread} new</span>}
        </h2>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {inquiries.length === 0 && !error && (
        <p className="admin-empty">No inquiries yet.</p>
      )}

      <div className="inquiry-list">
        {inquiries.map(inq => {
          const open = expanded.has(inq.id)
          const name = [inq.first_name, inq.last_name].filter(Boolean).join(' ') || '—'
          const date = new Date(inq.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          })

          return (
            <div
              key={inq.id}
              className={`inquiry-card${!inq.read ? ' inquiry-card-unread' : ''}`}
            >
              <div
                className="inquiry-card-header"
                onClick={() => toggleExpand(inq.id, inq.read)}
                style={{ cursor: 'pointer' }}
              >
                <div className="inquiry-card-header-left">
                  {!inq.read && <span className="inquiry-unread-dot" />}
                  <div>
                    <strong className="inquiry-name">{name}</strong>
                    <a
                      href={`mailto:${inq.email}`}
                      className="inquiry-email"
                      onClick={e => e.stopPropagation()}
                    >
                      {inq.email}
                    </a>
                  </div>
                </div>
                <div className="inquiry-card-header-right">
                  {inq.event_type && (
                    <span className="inquiry-tag">
                      {EVENT_LABELS[inq.event_type] ?? inq.event_type}
                    </span>
                  )}
                  {inq.event_date && (
                    <span className="inquiry-tag">{inq.event_date}</span>
                  )}
                  <time className="inquiry-date">{date}</time>
                  <span className="inquiry-chevron">{open ? '▲' : '▼'}</span>
                </div>
              </div>

              {open && (
                <div className="inquiry-card-body">
                  <dl className="inquiry-fields">
                    {inq.phone && <><dt>Phone</dt><dd>{inq.phone}</dd></>}
                    {inq.guest_count && <><dt>Guests</dt><dd>{inq.guest_count}</dd></>}
                    {inq.venue && <><dt>Venue</dt><dd>{inq.venue}</dd></>}
                    {inq.budget && (
                      <><dt>Budget</dt><dd>{BUDGET_LABELS[inq.budget] ?? inq.budget}</dd></>
                    )}
                    {inq.color_palette && (
                      <><dt>Palette</dt><dd>{inq.color_palette}</dd></>
                    )}
                    {inq.message && (
                      <><dt>Message</dt><dd className="inquiry-message">{inq.message}</dd></>
                    )}
                  </dl>

                  {inq.attachments.length > 0 && (
                    <div className="inquiry-attachments">
                      <p className="inquiry-attachments-label">Attachments</p>
                      <div className="inquiry-attachment-grid">
                        {inq.attachments.map(att => (
                          <a
                            key={att.id}
                            href={att.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inquiry-attachment-item"
                            download={att.filename}
                          >
                            {att.content_type.startsWith('image/') ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={att.storage_url} alt={att.filename} />
                            ) : (
                              <div className="inquiry-attachment-pdf">
                                <span>PDF</span>
                              </div>
                            )}
                            <span className="inquiry-attachment-name">{att.filename}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inquiry-card-actions">
                    <a href={`mailto:${inq.email}`} className="admin-btn admin-btn-sm admin-btn-primary">
                      Reply
                    </a>
                    <button
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => handleDelete(inq.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}
