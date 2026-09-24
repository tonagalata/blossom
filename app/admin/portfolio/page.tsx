'use client'

import { useEffect, useRef, useState } from 'react'
import type { PortfolioItem, PortfolioCategory } from '@/lib/types'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/components/ui/Toaster'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

function blankItem(defaultCategory: string): Omit<PortfolioItem, 'id' | 'order' | 'createdAt'> {
  return { src: '', alt: '', title: '', category: defaultCategory, wide: false, visible: true }
}

export default function PortfolioAdmin() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [categories, setCategories] = useState<PortfolioCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCategories, setSavingCategories] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState(blankItem(''))
  const [images, setImages] = useState<string[]>([])
  const [pickerFor, setPickerFor] = useState<'new' | string | null>(null)
  const [newCategoryLabel, setNewCategoryLabel] = useState('')

  const dragId = useRef<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/portfolio').then(r => r.json()),
      fetch('/api/admin/images').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
    ]).then(([portfolio, imgs, cats]) => {
      setItems(portfolio.sort((a: PortfolioItem, b: PortfolioItem) => a.order - b.order))
      setImages([...imgs.uploaded, ...imgs.builtin])
      setCategories(cats)
      setNewItem(blankItem(cats[0]?.value ?? ''))
      setLoading(false)
    })
  }, [])

  async function saveCategories(next: PortfolioCategory[]) {
    setSavingCategories(true)
    setCategories(next)
    const res = await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    setSavingCategories(false)
    if (res.ok) {
      toast.success('Categories saved')
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.message ? `Save failed: ${data.message}` : 'Save failed')
    }
  }

  function addCategory() {
    const label = newCategoryLabel.trim()
    if (!label) return
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!value || categories.some(c => c.value === value)) return
    saveCategories([...categories, { value, label }])
    setNewCategoryLabel('')
  }

  function renameCategory(value: string, label: string) {
    saveCategories(categories.map(c => c.value === value ? { ...c, label } : c))
  }

  function deleteCategory(value: string) {
    if (!confirm('Delete this category? Portfolio items using it will keep the old value but show unlabeled.')) return
    saveCategories(categories.filter(c => c.value !== value))
  }

  async function patchItem(id: string, patch: Partial<PortfolioItem>) {
    const updated = items.map(it => it.id === id ? { ...it, ...patch } : it)
    setItems(updated)
    await fetch(`/api/admin/portfolio/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    setItems(prev => prev.filter(it => it.id !== id))
    await fetch(`/api/admin/portfolio/${id}`, { method: 'DELETE' })
    toast.success('Item deleted')
  }

  async function addItem() {
    if (!newItem.src || !newItem.title) return
    setSaving(true)
    const res = await fetch('/api/admin/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    })
    const created = await res.json()
    setItems(prev => [...prev, created])
    setNewItem(blankItem(categories[0]?.value ?? ''))
    setShowAdd(false)
    setSaving(false)
    toast.success('Item added')
  }

  function onDragStart(id: string) { dragId.current = id }

  async function onDrop(targetId: string) {
    if (!dragId.current || dragId.current === targetId) return
    const from = items.findIndex(i => i.id === dragId.current)
    const to = items.findIndex(i => i.id === targetId)
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const reordered = next.map((it, idx) => ({ ...it, order: idx }))
    setItems(reordered)
    dragId.current = null
    await fetch('/api/admin/portfolio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered),
    })
    toast.success('Order saved')
  }

  function pickImage(src: string) {
    if (pickerFor === 'new') {
      setNewItem(prev => ({ ...prev, src }))
    } else if (pickerFor) {
      patchItem(pickerFor, { src })
    }
    setPickerFor(null)
  }

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Manage gallery images shown on the public portfolio."
        action={<Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Item</Button>}
      />

      <div className="mb-8 rounded-lg border border-bloom-border bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-bloom-text">Categories</h3>
        <div className="mb-3 space-y-2">
          {categories.map(c => (
            <div key={c.value} className="flex gap-2">
              <Input
                value={c.label}
                onChange={e => setCategories(prev => prev.map(cat => cat.value === c.value ? { ...cat, label: e.target.value } : cat))}
                onBlur={e => renameCategory(c.value, e.target.value)}
              />
              <Button variant="destructive" size="sm" onClick={() => deleteCategory(c.value)} disabled={savingCategories}>Delete</Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCategoryLabel}
            onChange={e => setNewCategoryLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
            placeholder="New category name"
          />
          <Button variant="outline" size="sm" onClick={addCategory} disabled={!newCategoryLabel.trim()}>Add Category</Button>
        </div>
      </div>

      <div className="rounded-lg border border-bloom-border bg-white">
        <div className="grid grid-cols-[24px_64px_1fr_140px_60px_60px_40px] items-center gap-3 border-b border-bloom-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-bloom-text-light">
          <span />
          <span>Image</span>
          <span>Title</span>
          <span>Category</span>
          <span>Wide</span>
          <span>Visible</span>
          <span />
        </div>

        {items.map(item => (
          <div
            key={item.id}
            className="grid grid-cols-[24px_64px_1fr_140px_60px_60px_40px] items-center gap-3 border-b border-bloom-border px-4 py-2.5 last:border-0"
            draggable
            onDragStart={() => onDragStart(item.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(item.id)}
          >
            <GripVertical className="h-4 w-4 cursor-grab text-bloom-text-light" />

            <div className="flex flex-col items-start gap-1">
              {item.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="h-10 w-10 rounded object-cover" src={item.src} alt={item.alt} />
              )}
              <button className="text-xs text-bloom-gold underline" onClick={() => setPickerFor(item.id)}>
                {item.src ? 'Change' : 'Pick'}
              </button>
            </div>

            <Input value={item.title} onChange={e => patchItem(item.id, { title: e.target.value })} placeholder="Title" />

            <Select value={item.category} onChange={e => patchItem(item.id, { category: e.target.value })}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>

            <input type="checkbox" checked={item.wide} onChange={e => patchItem(item.id, { wide: e.target.checked })} title="Wide layout" className="h-4 w-4" />

            <input type="checkbox" checked={item.visible} onChange={e => patchItem(item.id, { visible: e.target.checked })} title="Visible" className="h-4 w-4" />

            <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Add Portfolio Item">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-bloom-text-mid">Image</label>
            {newItem.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mb-2 h-24 w-24 rounded object-cover" src={newItem.src} alt="" />
            )}
            <Button variant="outline" size="sm" onClick={() => setPickerFor('new')}>{newItem.src ? 'Change Image' : 'Pick Image'}</Button>
          </div>
          <Input placeholder="Arrangement title" value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} />
          <Input placeholder="Alt text" value={newItem.alt} onChange={e => setNewItem(p => ({ ...p, alt: e.target.value }))} />
          <Select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <div className="flex gap-4 text-sm text-bloom-text">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={newItem.wide} onChange={e => setNewItem(p => ({ ...p, wide: e.target.checked }))} /> Wide layout</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={newItem.visible} onChange={e => setNewItem(p => ({ ...p, visible: e.target.checked }))} /> Visible</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addItem} disabled={saving || !newItem.src || !newItem.title}>{saving ? 'Adding…' : 'Add Item'}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={pickerFor !== null} onClose={() => setPickerFor(null)} title="Pick an Image" className="max-w-2xl">
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
