'use client'

import { useEffect, useState } from 'react'
import type { AboutPageContent } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toaster'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-bloom-text-mid">{label}</label>
      {children}
    </div>
  )
}

export default function AboutContentAdmin() {
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

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

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>
  if (!content) return <p className="text-sm text-bloom-text-mid">No content found.</p>

  return (
    <div>
      <PageHeader
        title="About Us Page"
        description="Edit the copy and image shown on the public About page."
        action={<Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent>
            <Field label="Eyebrow"><Input value={content.eyebrow} onChange={e => setContent({ ...content, eyebrow: e.target.value })} /></Field>
            <Field label="Title"><Input value={content.title} onChange={e => setContent({ ...content, title: e.target.value })} /></Field>
            <Field label="Paragraph 1"><Textarea value={content.body1} onChange={e => setContent({ ...content, body1: e.target.value })} /></Field>
            <Field label="Paragraph 2"><Textarea value={content.body2} onChange={e => setContent({ ...content, body2: e.target.value })} /></Field>
            <Field label="Button Label"><Input value={content.ctaLabel} onChange={e => setContent({ ...content, ctaLabel: e.target.value })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Image</CardTitle></CardHeader>
          <CardContent>
            {content.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mb-3 w-full max-w-sm rounded-md border border-bloom-border object-cover" src={content.image} alt="About" />
            )}
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>Change</Button>
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
