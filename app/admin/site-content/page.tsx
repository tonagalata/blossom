'use client'
import { useEffect, useState } from 'react'
import type { SiteConfig, HeroSlide } from '@/lib/types'

const SLOT_LABELS = ['Preview 1', 'Preview 2', 'Preview 3', 'Preview 4']

type PickerTarget = `preview-${number}` | 'heroSlideImage' | 'heroSlideVideo'

export default function SiteContentAdmin() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [pickerFor, setPickerFor] = useState<PickerTarget | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/site-config').then(r => r.json()),
      fetch('/api/admin/images').then(r => r.json()),
      fetch('/api/admin/videos').then(r => r.json()),
    ]).then(([cfg, imgs, vids]) => {
      setConfig(cfg)
      setImages([...imgs.uploaded, ...imgs.builtin])
      setVideos(vids.builtin)
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
    if (pickerFor.startsWith('preview-')) {
      const idx = parseInt(pickerFor.split('-')[1])
      const previews = [...config.previewImages] as [string, string, string, string]
      previews[idx] = src
      updated = { ...config, previewImages: previews }
    } else if (pickerFor === 'heroSlideImage') {
      updated = { ...config, heroSlides: [...config.heroSlides, { type: 'image', src }] }
    } else {
      setPickerFor(null)
      return
    }
    setConfig(updated)
    save(updated)
    setPickerFor(null)
  }

  function pickVideo(src: string) {
    if (!pickerFor || !config) { setPickerFor(null); return }
    if (pickerFor !== 'heroSlideVideo') { setPickerFor(null); return }
    const updated = { ...config, heroSlides: [...config.heroSlides, { type: 'video' as const, src }] }
    setConfig(updated)
    save(updated)
    setPickerFor(null)
  }

  function removeSlide(i: number) {
    if (!config) return
    const updated = { ...config, heroSlides: config.heroSlides.filter((_, idx) => idx !== i) }
    setConfig(updated)
    save(updated)
  }

  function moveSlide(i: number, dir: -1 | 1) {
    if (!config) return
    const j = i + dir
    if (j < 0 || j >= config.heroSlides.length) return
    const slides = [...config.heroSlides]
    ;[slides[i], slides[j]] = [slides[j], slides[i]]
    const updated = { ...config, heroSlides: slides }
    setConfig(updated)
    save(updated)
  }

  if (loading) return <div className="admin-loading">Loading…</div>
  if (!config) return <div className="admin-loading">No config found.</div>

  const pickerIsVideo = pickerFor === 'heroSlideVideo'

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

      <div className="admin-subsection">
        <h3 className="admin-subsection-title">Hero Slideshow</h3>
        <div className="slideshow-manager-list">
          {config.heroSlides.map((slide: HeroSlide, i) => (
            <div key={i} className="slideshow-manager-item">
              {slide.type === 'video' ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video className="slideshow-preview" src={slide.src} muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="slideshow-preview" src={slide.src} alt="" />
              )}
              <span className="slideshow-manager-type">{slide.type}</span>
              <div className="slideshow-manager-controls">
                <button className="admin-btn admin-btn-sm" onClick={() => moveSlide(i, -1)} disabled={i === 0} title="Move earlier">↑</button>
                <button className="admin-btn admin-btn-sm" onClick={() => moveSlide(i, 1)} disabled={i === config.heroSlides.length - 1} title="Move later">↓</button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => removeSlide(i)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-field-row" style={{ marginTop: 12 }}>
          <button className="admin-btn admin-btn-sm" onClick={() => setPickerFor('heroSlideImage')}>+ Add Image</button>
          <button className="admin-btn admin-btn-sm" onClick={() => setPickerFor('heroSlideVideo')}>+ Add Video</button>
        </div>

        <div className="admin-field" style={{ marginTop: 20, maxWidth: 220 }}>
          <label className="admin-label">Slide Duration (seconds)</label>
          <input
            className="admin-input"
            type="number"
            min={1}
            step={1}
            value={config.heroSlideDuration}
            onChange={e => setConfig({ ...config, heroSlideDuration: Number(e.target.value) })}
            onBlur={() => save({ ...config, heroSlideDuration: Math.max(1, config.heroSlideDuration || 1) })}
          />
        </div>
      </div>

      <div className="site-content-slot">
        <h3 className="admin-subsection-title">Portfolio Preview Images</h3>
        <div className="preview-slots">
          {config.previewImages.map((src, i) => (
            <div key={i} className="preview-slot">
              <span className="preview-slot-label">{SLOT_LABELS[i]}</span>
              <div className="site-content-preview-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="site-content-preview" src={src} alt={SLOT_LABELS[i]} />
              </div>
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

      {pickerFor !== null && (
        <div className="admin-modal-overlay" onClick={() => setPickerFor(null)}>
          <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">{pickerIsVideo ? 'Pick a Video' : 'Pick an Image'}</h3>
            <div className="image-picker-grid">
              {pickerIsVideo ? (
                videos.length > 0 ? videos.map(src => (
                  <div key={src} className="image-picker-item" onClick={() => pickVideo(src)}>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={src} muted />
                  </div>
                )) : <p className="admin-loading">No videos in public/videos yet.</p>
              ) : (
                images.map(src => (
                  <div key={src} className="image-picker-item" onClick={() => pickImage(src)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </div>
                ))
              )}
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
