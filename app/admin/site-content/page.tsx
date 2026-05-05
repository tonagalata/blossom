'use client'
import { useEffect, useState } from 'react'
import type { SiteConfig } from '@/lib/types'

const SLOT_LABELS = ['Preview 1', 'Preview 2', 'Preview 3', 'Preview 4']

export default function SiteContentAdmin() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [pickerFor, setPickerFor] = useState<keyof SiteConfig | `preview-${number}` | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/site-config').then(r => r.json()),
      fetch('/api/admin/images').then(r => r.json()),
    ]).then(([cfg, imgs]) => {
      setConfig(cfg)
      setImages([...imgs.uploaded, ...imgs.builtin])
      setLoading(false)
    })
  }, [])

  async function save(updated: SiteConfig) {
    setSaving(true)
    await fetch('/api/admin/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setSaving(false)
    showToast('Saved')
  }

  function pickImage(src: string) {
    if (!pickerFor || !config) { setPickerFor(null); return }
    let updated: SiteConfig
    if (pickerFor === 'heroImage' || pickerFor === 'aboutImage') {
      updated = { ...config, [pickerFor]: src }
    } else if (pickerFor.startsWith('preview-')) {
      const idx = parseInt(pickerFor.split('-')[1])
      const previews = [...config.previewImages] as [string, string, string, string]
      previews[idx] = src
      updated = { ...config, previewImages: previews }
    } else {
      setPickerFor(null)
      return
    }
    setConfig(updated)
    save(updated)
    setPickerFor(null)
  }

  if (loading) return <div className="admin-loading">Loading…</div>
  if (!config) return <div className="admin-loading">No config found.</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Site Content</h2>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => save(config)}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="site-content-grid">
        <div className="site-content-slot">
          <h3 className="admin-subsection-title">Hero Image</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="site-content-preview" src={config.heroImage} alt="Hero" />
          <button className="admin-btn admin-btn-sm" onClick={() => setPickerFor('heroImage')}>
            Change
          </button>
        </div>

        <div className="site-content-slot">
          <h3 className="admin-subsection-title">About Image</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="site-content-preview" src={config.aboutImage} alt="About" />
          <button className="admin-btn admin-btn-sm" onClick={() => setPickerFor('aboutImage')}>
            Change
          </button>
        </div>

        <div className="site-content-slot site-content-slot-full">
          <h3 className="admin-subsection-title">Portfolio Preview Images</h3>
          <div className="preview-slots">
            {config.previewImages.map((src, i) => (
              <div key={i} className="preview-slot">
                <span className="preview-slot-label">{SLOT_LABELS[i]}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="site-content-preview" src={src} alt={SLOT_LABELS[i]} />
                <button
                  className="admin-btn admin-btn-sm"
                  onClick={() => setPickerFor(`preview-${i}` as `preview-${number}`)}
                >
                  Change
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pickerFor !== null && (
        <div className="admin-modal-overlay" onClick={() => setPickerFor(null)}>
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
              <button className="admin-btn" onClick={() => setPickerFor(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}
