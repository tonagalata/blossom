'use client'

import { useEffect, useState } from 'react'
import type { PopupContent } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toaster'
import { Plus, Trash2 } from 'lucide-react'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-bloom-text-mid">{label}</label>
      {children}
    </div>
  )
}

export default function PopupAdmin() {
  const [content, setContent] = useState<PopupContent | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

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
    const res = await fetch('/api/admin/popup-content', {
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

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>
  if (!content) return <p className="text-sm text-bloom-text-mid">No content found.</p>

  return (
    <div>
      <PageHeader
        title="Popup Inquiry"
        description="Edit the intent popup shown to first-time visitors."
        action={<Button onClick={() => save(content)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent>
            <Field label="Eyebrow"><Input value={content.eyebrow} onChange={e => setContent({ ...content, eyebrow: e.target.value })} /></Field>
            <Field label="Title"><Input value={content.title} onChange={e => setContent({ ...content, title: e.target.value })} /></Field>
            <Field label="Body"><Textarea value={content.body} onChange={e => setContent({ ...content, body: e.target.value })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Image</CardTitle></CardHeader>
          <CardContent>
            {content.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mb-3 w-full max-w-sm rounded-md border border-bloom-border object-cover" src={content.image} alt="Popup" />
            )}
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>Change</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Options</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3 space-y-2">
              {content.options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Label shown to visitor" value={o.label} onChange={e => updateOption(i, { label: e.target.value })} />
                  <Input placeholder="Internal value (event type)" value={o.value} onChange={e => updateOption(i, { value: e.target.value })} />
                  <Button variant="destructive" size="sm" onClick={() => removeOption(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addOption}><Plus className="h-3.5 w-3.5" /> Add Option</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick an Image" className="max-w-2xl">
        <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
          {images.map(src => (
            <button key={src} onClick={() => pickImage(src)} className="aspect-square overflow-hidden rounded-md border border-bloom-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  )
}
