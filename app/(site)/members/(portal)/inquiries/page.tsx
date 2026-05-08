'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Inquiry {
  id: string
  created_at: string
  subject: string
  message: string
  status: 'open' | 'replied' | 'closed'
  reply: string | null
  replied_at: string | null
}

export default function MemberInquiriesPage() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  async function load() {
    const res = await fetch('/api/members/inquiries')
    if (res.status === 401) { router.push('/members/login'); return }
    const data = await res.json()
    setInquiries(data.inquiries || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/members/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Failed to submit'); return }
      setSubject('')
      setMessage('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await load()
    } catch {
      setFormError('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="member-inquiries">
      <h1 className="member-page-title">Inquiries</h1>

      <div className="member-inquiry-form-wrap">
        <h2 className="member-section-title">Send a Message</h2>
        <form onSubmit={handleSubmit} className="member-inquiry-form">
          {formError && <p className="form-error">{formError}</p>}
          {success && <p className="form-success">Message sent!</p>}
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              className="form-input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-input form-textarea"
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>

      <div className="member-inquiry-list">
        <h2 className="member-section-title">Message History</h2>
        {loading ? (
          <p className="member-loading">Loading…</p>
        ) : inquiries.length === 0 ? (
          <p className="member-empty">No messages yet.</p>
        ) : (
          inquiries.map(inq => (
            <div key={inq.id} className={`member-inquiry-item status-${inq.status}`}>
              <div className="member-inquiry-header">
                <strong>{inq.subject}</strong>
                <span className="member-inquiry-status">{inq.status}</span>
              </div>
              <p className="member-inquiry-body">{inq.message}</p>
              <p className="member-inquiry-date">
                {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {inq.reply && (
                <div className="member-inquiry-reply">
                  <p className="member-inquiry-reply-label">Reply from Events in Bloom:</p>
                  <p>{inq.reply}</p>
                  {inq.replied_at && (
                    <p className="member-inquiry-date">
                      {new Date(inq.replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
