'use client'

import { useEffect, useState } from 'react'
import type { LandingContent } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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

export default function LandingContentAdmin() {
  const [content, setContent] = useState<LandingContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      toast.success('Saved')
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.message ? `Save failed: ${data.message}` : 'Save failed')
    }
  }

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>
  if (!content) return <p className="text-sm text-bloom-text-mid">No content found.</p>

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
    <div>
      <PageHeader
        title="Landing Page"
        description="Edit the copy shown on the public homepage."
        action={<Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Hero</CardTitle></CardHeader>
          <CardContent>
            <Field label="Subtitle"><Input value={content.hero.subtitle} onChange={e => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })} /></Field>
            <Field label="Button Label"><Input value={content.hero.buttonLabel} onChange={e => setContent({ ...content, hero: { ...content.hero, buttonLabel: e.target.value } })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Our Story</CardTitle></CardHeader>
          <CardContent>
            <Field label="Eyebrow"><Input value={content.about.eyebrow} onChange={e => setContent({ ...content, about: { ...content.about, eyebrow: e.target.value } })} /></Field>
            <Field label="Title"><Input value={content.about.title} onChange={e => setContent({ ...content, about: { ...content.about, title: e.target.value } })} /></Field>
            <Field label="Body"><Textarea value={content.about.body} onChange={e => setContent({ ...content, about: { ...content.about, body: e.target.value } })} /></Field>
            <Field label="Button Label"><Input value={content.about.ctaLabel} onChange={e => setContent({ ...content, about: { ...content.about, ctaLabel: e.target.value } })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Services</CardTitle></CardHeader>
          <CardContent>
            <Field label="Heading"><Input value={content.services.heading} onChange={e => setContent({ ...content, services: { ...content.services, heading: e.target.value } })} /></Field>
            {content.services.items.map((item, i) => (
              <div key={i} className="mb-3 rounded-md border border-bloom-border p-3">
                <Field label={`Service ${i + 1} Title`}><Input value={item.title} onChange={e => updateServiceItem(i, { title: e.target.value })} /></Field>
                <Field label={`Service ${i + 1} Description`}><Textarea value={item.desc} onChange={e => updateServiceItem(i, { desc: e.target.value })} /></Field>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Gallery</CardTitle></CardHeader>
          <CardContent>
            <Field label="Heading"><Input value={content.gallery.heading} onChange={e => setContent({ ...content, gallery: { heading: e.target.value } })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Featured Testimonial</CardTitle></CardHeader>
          <CardContent>
            <Field label="Quote"><Textarea value={content.testimonial.quote} onChange={e => setContent({ ...content, testimonial: { ...content.testimonial, quote: e.target.value } })} /></Field>
            <Field label="Attribution"><Input value={content.testimonial.attribution} onChange={e => setContent({ ...content, testimonial: { ...content.testimonial, attribution: e.target.value } })} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>More Testimonials</CardTitle></CardHeader>
          <CardContent>
            {content.testimonials.map((t, i) => (
              <div key={i} className="mb-3 rounded-md border border-bloom-border p-3">
                <Field label={`Testimonial ${i + 1} Quote`}><Textarea value={t.quote} onChange={e => updateTestimonial(i, { quote: e.target.value })} /></Field>
                <Field label={`Testimonial ${i + 1} Attribution`}><Input value={t.attribution} onChange={e => updateTestimonial(i, { attribution: e.target.value })} /></Field>
                <Button variant="destructive" size="sm" onClick={() => removeTestimonial(i)}><Trash2 className="h-3.5 w-3.5" /> Delete Testimonial</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTestimonial}><Plus className="h-3.5 w-3.5" /> Add Testimonial</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Final Call to Action</CardTitle></CardHeader>
          <CardContent>
            <Field label="Heading"><Input value={content.cta.heading} onChange={e => setContent({ ...content, cta: { ...content.cta, heading: e.target.value } })} /></Field>
            <Field label="Button Label"><Input value={content.cta.buttonLabel} onChange={e => setContent({ ...content, cta: { ...content.cta, buttonLabel: e.target.value } })} /></Field>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
