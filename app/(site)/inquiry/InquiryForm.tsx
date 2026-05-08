'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InquiryForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const data = new FormData(e.currentTarget)
    data.delete('attachments')
    for (const f of files) data.append('attachments', f)

    const res = await fetch('/api/inquiry', { method: 'POST', body: data })

    if (res.ok) {
      router.push('/thanks')
    } else {
      setError('Something went wrong. Please try again or email us directly.')
      setSubmitting(false)
    }
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form className="inquiry-form" onSubmit={handleSubmit}>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="firstName">First Name *</label>
          <input className="form-input" type="text" id="firstName" name="first_name" placeholder="Jane" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="lastName">Last Name *</label>
          <input className="form-input" type="text" id="lastName" name="last_name" placeholder="Doe" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email *</label>
          <input className="form-input" type="email" id="email" name="email" placeholder="jane@example.com" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone</label>
          <input className="form-input" type="tel" id="phone" name="phone" placeholder="(555) 000-0000" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="eventType">Event Type *</label>
        <select className="form-select" id="eventType" name="event_type" required defaultValue="">
          <option value="" disabled>Select an event type</option>
          <option value="wedding">Wedding</option>
          <option value="engagement">Engagement Party</option>
          <option value="birthday">Birthday Celebration</option>
          <option value="baby-shower">Baby Shower</option>
          <option value="bridal-shower">Bridal Shower</option>
          <option value="corporate">Corporate Event</option>
          <option value="gala">Gala or Fundraiser</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="eventDate">Event Date *</label>
          <input className="form-input" type="date" id="eventDate" name="event_date" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="guestCount">Estimated Guest Count</label>
          <input className="form-input" type="number" id="guestCount" name="guest_count" placeholder="100" min="1" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="budget">Estimated Budget</label>
          <select className="form-select" id="budget" name="budget" defaultValue="">
            <option value="" disabled>Select a range</option>
            <option value="under-2k">Under $2,000</option>
            <option value="2-5k">$2,000 – $5,000</option>
            <option value="5-10k">$5,000 – $10,000</option>
            <option value="10-20k">$10,000 – $20,000</option>
            <option value="20k+">$20,000+</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="venue">Venue / Location</label>
          <input className="form-input" type="text" id="venue" name="venue" placeholder="Venue name or city" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="colorPalette">Color Palette or Aesthetic</label>
        <input className="form-input" type="text" id="colorPalette" name="color_palette" placeholder="e.g. blush, ivory, sage — romantic garden style" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="message">Tell Us About Your Vision *</label>
        <textarea
          className="form-textarea"
          id="message"
          name="message"
          placeholder="Share your vision, inspiration, must-haves, or anything else you'd like us to know…"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Inspiration Images or Attachments</label>
        <div
          className="form-file-zone"
          onClick={() => fileRef.current?.click()}
        >
          <span className="form-file-icon">↑</span>
          <span>Click to attach images, mood boards, or PDFs</span>
          <span className="form-file-hint">Up to 5 files · 8 MB each · JPG, PNG, PDF</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={e => {
            const next = Array.from(e.target.files ?? []).slice(0, 5)
            setFiles(next)
            e.target.value = ''
          }}
        />
        {files.length > 0 && (
          <ul className="form-file-list">
            {files.map((f, i) => (
              <li key={i}>
                <span>{f.name}</span>
                <button type="button" className="form-file-remove" onClick={() => removeFile(i)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
      <p className="form-note">* Required fields. We respond within 2 business days.</p>
      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Inquiry'}
      </button>

    </form>
  )
}
