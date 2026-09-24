'use client'

import { useEffect, useState } from 'react'
import type { SiteConfig, HeroSlide } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toaster'
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react'

const SLOT_LABELS = ['Preview 1', 'Preview 2', 'Preview 3', 'Preview 4']

type PickerTarget = `preview-${number}` | 'heroSlideImage' | 'heroSlideVideo'

export default function SiteContentAdmin() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerFor, setPickerFor] = useState<PickerTarget | null>(null)

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
    const res = await fetch('/api/admin/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Saved')
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.message ? `Save failed: ${data.message}` : 'Save failed')
    }
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

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>
  if (!config) return <p className="text-sm text-bloom-text-mid">No config found.</p>

  const pickerIsVideo = pickerFor === 'heroSlideVideo'

  return (
    <div>
      <PageHeader
        title="Site Content"
        description="Hero slideshow and portfolio preview images."
        action={<Button onClick={() => save(config)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}
      />

      <div className="mb-8 rounded-lg border border-bloom-border bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-bloom-text">Hero Slideshow</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {config.heroSlides.map((slide: HeroSlide, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-bloom-border">
              {slide.type === 'video' ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video className="aspect-video w-full object-cover" src={slide.src} muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="aspect-video w-full object-cover" src={slide.src} alt="" />
              )}
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-bloom-text-light">{slide.type}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => moveSlide(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => moveSlide(i, 1)} disabled={i === config.heroSlides.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => removeSlide(i)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPickerFor('heroSlideImage')}><Plus className="h-3.5 w-3.5" /> Add Image</Button>
          <Button variant="outline" size="sm" onClick={() => setPickerFor('heroSlideVideo')}><Plus className="h-3.5 w-3.5" /> Add Video</Button>
        </div>

        <div className="mt-5 max-w-[220px]">
          <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Slide Duration (seconds)</label>
          <Input
            type="number" min={1} step={1}
            value={config.heroSlideDuration}
            onChange={e => setConfig({ ...config, heroSlideDuration: Number(e.target.value) })}
            onBlur={() => save({ ...config, heroSlideDuration: Math.max(1, config.heroSlideDuration || 1) })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-bloom-border bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-bloom-text">Portfolio Preview Images</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {config.previewImages.map((src, i) => (
            <div key={i}>
              <p className="mb-1 text-xs text-bloom-text-light">{SLOT_LABELS[i]}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mb-2 aspect-square w-full rounded-md border border-bloom-border object-cover" src={src} alt={SLOT_LABELS[i]} />
              <Button variant="outline" size="sm" onClick={() => setPickerFor(`preview-${i}` as `preview-${number}`)}>Change</Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={pickerFor !== null} onClose={() => setPickerFor(null)} title={pickerIsVideo ? 'Pick a Video' : 'Pick an Image'} className="max-w-2xl">
        <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
          {pickerIsVideo ? (
            videos.length > 0 ? videos.map(src => (
              <button key={src} onClick={() => pickVideo(src)} className="aspect-square overflow-hidden rounded-md border border-bloom-border">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={src} muted className="h-full w-full object-cover" />
              </button>
            )) : <p className="col-span-full text-sm text-bloom-text-mid">No videos in public/videos yet.</p>
          ) : (
            images.map(src => (
              <button key={src} onClick={() => pickImage(src)} className="aspect-square overflow-hidden rounded-md border border-bloom-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))
          )}
        </div>
      </Dialog>
    </div>
  )
}
