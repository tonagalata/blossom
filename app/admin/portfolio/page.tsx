'use client'
import { useEffect, useRef, useState } from 'react'
import type { PortfolioItem, Category } from '@/lib/types'

const CATEGORIES: Category[] = ['arrangements', 'events', 'rentals']

function blankItem(): Omit<PortfolioItem, 'id' | 'order' | 'createdAt'> {
  return { src: '', alt: '', title: '', category: 'arrangements', wide: false, visible: true }
}

export default function PortfolioAdmin() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState(blankItem())
  const [images, setImages] = useState<string[]>([])
  const [pickerFor, setPickerFor] = useState<'new' | string | null>(null)

  const dragId = useRef<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/portfolio').then(r => r.json()),
      fetch('/api/admin/images').then(r => r.json()),
    ]).then(([portfolio, imgs]) => {
      setItems(portfolio.sort((a: PortfolioItem, b: PortfolioItem) => a.order - b.order))
      setImages([...imgs.uploaded, ...imgs.builtin])
      setLoading(false)
    })
  }, [])

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
    showToast('Item deleted')
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
    setNewItem(blankItem())
    setShowAdd(false)
    setSaving(false)
    showToast('Item added')
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
    showToast('Order saved')
  }

  function pickImage(src: string) {
    if (pickerFor === 'new') {
      setNewItem(prev => ({ ...prev, src }))
    } else if (pickerFor) {
      patchItem(pickerFor, { src })
    }
    setPickerFor(null)
  }

  if (loading) return <div className="admin-loading">Loading…</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Portfolio</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(true)}>
          + Add Item
        </button>
      </div>

      <div className="portfolio-admin-list">
        <div className="portfolio-admin-header-row">
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
            className="portfolio-admin-row"
            draggable
            onDragStart={() => onDragStart(item.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(item.id)}
          >
            <span className="drag-handle" title="Drag to reorder">⠿</span>

            <div className="portfolio-admin-thumb-wrap">
              {item.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="portfolio-admin-thumb" src={item.src} alt={item.alt} />
              )}
              <button
                className="admin-btn admin-btn-sm"
                onClick={() => setPickerFor(item.id)}
              >
                {item.src ? 'Change' : 'Pick'}
              </button>
            </div>

            <input
              className="admin-input"
              value={item.title}
              onChange={e => patchItem(item.id, { title: e.target.value })}
              onBlur={e => patchItem(item.id, { title: e.target.value })}
              placeholder="Title"
            />

            <select
              className="admin-select"
              value={item.category}
              onChange={e => patchItem(item.id, { category: e.target.value as Category })}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              type="checkbox"
              checked={item.wide}
              onChange={e => patchItem(item.id, { wide: e.target.checked })}
              title="Wide layout"
            />

            <label className="admin-toggle" title="Visible">
              <input
                type="checkbox"
                checked={item.visible}
                onChange={e => patchItem(item.id, { visible: e.target.checked })}
              />
              <span className="admin-toggle-track" />
            </label>

            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              onClick={() => deleteItem(item.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="admin-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal-title">Add Portfolio Item</h3>

            <div className="admin-field">
              <label className="admin-label">Image</label>
              {newItem.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="admin-preview-img" src={newItem.src} alt="" />
              )}
              <button className="admin-btn admin-btn-sm" onClick={() => setPickerFor('new')}>
                {newItem.src ? 'Change Image' : 'Pick Image'}
              </button>
            </div>

            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input
                className="admin-input"
                value={newItem.title}
                onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                placeholder="Arrangement title"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Alt text</label>
              <input
                className="admin-input"
                value={newItem.alt}
                onChange={e => setNewItem(p => ({ ...p, alt: e.target.value }))}
                placeholder="Describe the image"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Category</label>
              <select
                className="admin-select"
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value as Category }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="admin-field admin-field-row">
              <label className="admin-label">
                <input
                  type="checkbox"
                  checked={newItem.wide}
                  onChange={e => setNewItem(p => ({ ...p, wide: e.target.checked }))}
                />
                {' '}Wide layout
              </label>
              <label className="admin-label">
                <input
                  type="checkbox"
                  checked={newItem.visible}
                  onChange={e => setNewItem(p => ({ ...p, visible: e.target.checked }))}
                />
                {' '}Visible
              </label>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={addItem}
                disabled={saving || !newItem.src || !newItem.title}
              >
                {saving ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

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
