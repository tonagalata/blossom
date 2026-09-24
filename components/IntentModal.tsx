'use client'
import { useEffect, useState } from 'react'
import type { PopupContent } from '@/lib/types'

export default function IntentModal({ content }: { content: PopupContent }) {
  const [open, setOpen] = useState(false)
  const [interest, setInterest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('eib_popup_seen')) {
      const t = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  function close() {
    localStorage.setItem('eib_popup_seen', '1')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!interest) {
      setError('Please select what brings you here.')
      return
    }
    setSubmitting(true)
    setError('')

    const data = new FormData(e.currentTarget)
    data.set('event_type', interest)

    const res = await fetch('/api/inquiry', { method: 'POST', body: data })

    if (res.ok) {
      localStorage.setItem('eib_popup_seen', '1')
      setSent(true)
    } else {
      setError('Something went wrong. Please try again or email us directly.')
    }
    setSubmitting(false)
  }

  if (!open) return null

  return (
    <div className="intent-modal-overlay" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="intent-modal">
        <div className="intent-modal-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.image} alt="Floral arrangement" />
        </div>
        <div className="intent-modal-panel">
          <button className="intent-modal-close" onClick={close} aria-label="Close">✕</button>

          {sent ? (
            <div className="intent-modal-success">
              <p className="intent-modal-eyebrow">thank you</p>
              <h2 className="intent-modal-title">We&apos;ll be in touch</h2>
              <p className="intent-modal-body">
                We&apos;ve received your message and respond within 2 business days.
              </p>
              <button className="intent-modal-submit" onClick={close}>Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="intent-modal-eyebrow">{content.eyebrow}</p>
              <h2 className="intent-modal-title">{content.title}</h2>
              <p className="intent-modal-body">{content.body}</p>

              <div className="intent-modal-fields">
                <div className="form-row">
                  <input className="form-input" type="text" name="first_name" placeholder="Name *" required />
                  <input className="form-input" type="email" name="email" placeholder="Email *" required />
                </div>
              </div>

              <p className="intent-modal-label">Select one to continue</p>
              <div className="intent-modal-options">
                {content.options.map(o => (
                  <label key={o.value} className="intent-option">
                    <input
                      type="radio"
                      name="interest"
                      value={o.value}
                      checked={interest === o.value}
                      onChange={() => setInterest(o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>

              {error && <p className="form-error">{error}</p>}
              <button className="intent-modal-submit" type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Inquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
