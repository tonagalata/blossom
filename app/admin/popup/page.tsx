'use client'
import { useEffect, useState } from 'react'
import type { PopupContent } from '@/lib/types'

export default function PopupAdmin() {
  const [content, setContent] = useState<PopupContent | null>(null)
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
      fetch('/api/admin/popup-content').then(r => r.json()),
      fetch('/api/admin/images').then(r => r.json()),
    ]).then(([c, imgs]) => {
      setContent(c)
      setImages([...imgs.uploaded, ...imgs.builtin])
      setLoading(false)
    })
  }, [])

  async function save(updated: PopupContent) {
    setSaving(true)
    await fetch('/api/admin/popup-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setSaving(false)
    showToast('Saved')
  }

  function pickImage(src: string) {
    if (content) setContent({ ...content, image: src })
    setPickerOpen(false)
  }

  function updateOption(i: number, patch: Partial<{ value: string; label: string }>) {
    if (!content) return
    const options = content.options.map((o, idx) => idx === i ? { ...o, ...patch } : o)
    setContent({ ...content, options })
  }

  function addOption() {
    if (!content) return
    setContent({ ...content, options: [...content.options, { value: '', label: '' }] })
  }

  function removeOption(i: number) {
    if (!content) return
    setContent({ ...content, options: content.options.filter((_, idx) => idx !== i) })
  }

  if (loading) return <div className="admin-loading">Loading…</div>
  if (!content) return <div className="admin-loading">No content found.</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Popup Inquiry</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => save(content)} disabled={saving}>
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
          <label className="admin-label">Body</label>
          <textarea
            className="admin-textarea"
            value={content.body}
            onChange={e => setContent({ ...content, body: e.target.value })}
          />
        </div>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Image</h3>
        {content.image && (
          <div className="site-content-preview-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="site-content-preview" src={content.image} alt="Popup" />
          </div>
        )}
        <button className="admin-btn admin-btn-sm" onClick={() => setPickerOpen(true)}>
          Change
        </button>
      </div>

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Options</h3>
        <div className="category-manager-list">
          {content.options.map((o, i) => (
            <div key={i} className="category-manager-row">
              <input
                className="admin-input"
                value={o.label}
                placeholder="Label shown to visitor"
                onChange={e => updateOption(i, { label: e.target.value })}
              />
              <input
                className="admin-input"
                value={o.value}
                placeholder="Internal value (event type)"
                onChange={e => updateOption(i, { value: e.target.value })}
              />
              <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeOption(i)}>
                Delete
              </button>
            </div>
          ))}
        </div>
        <button className="admin-btn admin-btn-sm" onClick={addOption}>+ Add Option</button>
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
