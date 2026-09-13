'use client'
import { useEffect, useState } from 'react'
import type { AboutPageContent } from '@/lib/types'

export default function AboutContentAdmin() {
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/about-content').then(r => r.json()),
      fetch('/api/admin/images').then(r => r.json()),
    ]).then(([c, imgs]) => {
      setContent(c)
      setImages([...imgs.uploaded, ...imgs.builtin])
      setLoading(false)
    })
  }, [])

  async function save() {
    if (!content) return
    setSaving(true)
    const res = await fetch('/api/admin/about-content', {
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

  function pickImage(src: string) {
    if (content) setContent({ ...content, image: src })
    setPickerOpen(false)
  }

  if (loading) return <div className="admin-loading">Loading…</div>
  if (!content) return <div className="admin-loading">No content found.</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">About Us Page</h2>
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Content</h3>
        <div className="admin-field">
          <label className="admin-label">Eyebrow</label>
          <input
            className="admin-input"
            value={content.eyebrow}
            onChange={e => setContent({ ...content, eyebrow: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Title</label>
          <input
            className="admin-input"
            value={content.title}
            onChange={e => setContent({ ...content, title: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Paragraph 1</label>
          <textarea
            className="admin-textarea"
            value={content.body1}
            onChange={e => setContent({ ...content, body1: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Paragraph 2</label>
          <textarea
            className="admin-textarea"
            value={content.body2}
            onChange={e => setContent({ ...content, body2: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label className="admin-label">Button Label</label>
          <input
            className="admin-input"
            value={content.ctaLabel}
            onChange={e => setContent({ ...content, ctaLabel: e.target.value })}
          />
        </div>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Image</h3>
        {content.image && (
          <div className="site-content-preview-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="site-content-preview" src={content.image} alt="About" />
          </div>
        )}
        <button className="admin-btn admin-btn-sm" onClick={() => setPickerOpen(true)}>
          Change
        </button>
      </div>

      {pickerOpen && (
        <div className="admin-modal-overlay" onClick={() => setPickerOpen(false)}>
          <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">Pick an Image</h3>
            <div className="image-picker-grid">
              {images.map(src => (
                <div key={src} className="image-picker-item" onClick={() => pickImage(src)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={() => setPickerOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}
