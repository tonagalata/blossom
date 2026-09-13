'use client'
import { useEffect, useState } from 'react'
import type { LandingContent } from '@/lib/types'

export default function LandingContentAdmin() {
  const [content, setContent] = useState<LandingContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    fetch('/api/admin/landing-content').then(r => r.json()).then(c => {
      setContent(c)
      setLoading(false)
    })
  }, [])

  async function save() {
    if (!content) return
    setSaving(true)
    const res = await fetch('/api/admin/landing-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Saved')
    } else {
      const data = await res.json().catch(() => null)
      showToast(data?.message ? `Save failed: ${data.message}` : 'Save failed')
    }
  }

  if (loading) return <div className="admin-loading">Loading…</div>
  if (!content) return <div className="admin-loading">No content found.</div>

  function updateServiceItem(i: number, patch: Partial<{ title: string; desc: string }>) {
    setContent(c => {
      if (!c) return c
      const items = c.services.items.map((it, idx) => idx === i ? { ...it, ...patch } : it)
      return { ...c, services: { ...c.services, items } }
    })
  }

  function updateTestimonial(i: number, patch: Partial<{ quote: string; attribution: string }>) {
    setContent(c => {
      if (!c) return c
      const testimonials = c.testimonials.map((t, idx) => idx === i ? { ...t, ...patch } : t)
      return { ...c, testimonials }
    })
  }

  function addTestimonial() {
    setContent(c => c ? { ...c, testimonials: [...c.testimonials, { quote: '', attribution: '' }] } : c)
  }

  function removeTestimonial(i: number) {
    setContent(c => c ? { ...c, testimonials: c.testimonials.filter((_, idx) => idx !== i) } : c)
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Landing Page</h2>
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Hero</h3>
        <div className="admin-field">
          <label className="admin-label">Subtitle</label>
          <input
            className="admin-input"
            value={content.hero.subtitle}
            onChange={e => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Button Label</label>
          <input
            className="admin-input"
            value={content.hero.buttonLabel}
            onChange={e => setContent({ ...content, hero: { ...content.hero, buttonLabel: e.target.value } })}
          />
        </div>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Our Story</h3>
        <div className="admin-field">
          <label className="admin-label">Eyebrow</label>
          <input
            className="admin-input"
            value={content.about.eyebrow}
            onChange={e => setContent({ ...content, about: { ...content.about, eyebrow: e.target.value } })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Title</label>
          <input
            className="admin-input"
            value={content.about.title}
            onChange={e => setContent({ ...content, about: { ...content.about, title: e.target.value } })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Body</label>
          <textarea
            className="admin-textarea"
            value={content.about.body}
            onChange={e => setContent({ ...content, about: { ...content.about, body: e.target.value } })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Button Label</label>
          <input
            className="admin-input"
            value={content.about.ctaLabel}
            onChange={e => setContent({ ...content, about: { ...content.about, ctaLabel: e.target.value } })}
          />
        </div>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Services</h3>
        <div className="admin-field">
          <label className="admin-label">Heading</label>
          <input
            className="admin-input"
            value={content.services.heading}
            onChange={e => setContent({ ...content, services: { ...content.services, heading: e.target.value } })}
          />
        </div>
        {content.services.items.map((item, i) => (
          <div key={i} className="admin-field-group">
            <div className="admin-field">
              <label className="admin-label">Service {i + 1} Title</label>
              <input
                className="admin-input"
                value={item.title}
                onChange={e => updateServiceItem(i, { title: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Service {i + 1} Description</label>
              <textarea
                className="admin-textarea"
                value={item.desc}
                onChange={e => updateServiceItem(i, { desc: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Gallery</h3>
        <div className="admin-field">
          <label className="admin-label">Heading</label>
          <input
            className="admin-input"
            value={content.gallery.heading}
            onChange={e => setContent({ ...content, gallery: { heading: e.target.value } })}
          />
        </div>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Featured Testimonial</h3>
        <div className="admin-field">
          <label className="admin-label">Quote</label>
          <textarea
            className="admin-textarea"
            value={content.testimonial.quote}
            onChange={e => setContent({ ...content, testimonial: { ...content.testimonial, quote: e.target.value } })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Attribution</label>
          <input
            className="admin-input"
            value={content.testimonial.attribution}
            onChange={e => setContent({ ...content, testimonial: { ...content.testimonial, attribution: e.target.value } })}
          />
        </div>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">More Testimonials</h3>
        {content.testimonials.map((t, i) => (
          <div key={i} className="admin-field-group">
            <div className="admin-field">
              <label className="admin-label">Testimonial {i + 1} Quote</label>
              <textarea
                className="admin-textarea"
                value={t.quote}
                onChange={e => updateTestimonial(i, { quote: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Testimonial {i + 1} Attribution</label>
              <input
                className="admin-input"
                value={t.attribution}
                onChange={e => updateTestimonial(i, { attribution: e.target.value })}
              />
            </div>
            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeTestimonial(i)}>
              Delete Testimonial
            </button>
          </div>
        ))}
        <button className="admin-btn admin-btn-sm" onClick={addTestimonial} style={{ marginTop: 12 }}>
          + Add Testimonial
        </button>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Final Call to Action</h3>
        <div className="admin-field">
          <label className="admin-label">Heading</label>
          <input
            className="admin-input"
            value={content.cta.heading}
            onChange={e => setContent({ ...content, cta: { ...content.cta, heading: e.target.value } })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Button Label</label>
          <input
            className="admin-input"
            value={content.cta.buttonLabel}
            onChange={e => setContent({ ...content, cta: { ...content.cta, buttonLabel: e.target.value } })}
          />
        </div>
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}
