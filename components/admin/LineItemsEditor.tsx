'use client'

import { useRef, useState } from 'react'
import type { LineItem } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, ImagePlus, X } from 'lucide-react'
import { blankLineItem } from '@/lib/lineItems'
import { toast } from '@/components/ui/Toaster'

function fmtMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function LineItemsEditor({ items, onChange, taxRate, onTaxRateChange, currency = 'usd', allowImages = false }: {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  taxRate: number
  onTaxRateChange: (rate: number) => void
  currency?: string
  allowImages?: boolean
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  function update(id: string, patch: Partial<LineItem>) {
    onChange(items.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }

  function addRow() {
    onChange([...items, blankLineItem(items.length)])
  }

  function removeRow(id: string) {
    onChange(items.filter(i => i.id !== id))
  }

  async function handleImageUpload(id: string, file: File) {
    setUploadingId(id)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    setUploadingId(null)
    if (res.ok) {
      const data = await res.json()
      update(id, { image_url: data.url })
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Image upload failed')
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unit_price, 0)
  const taxAmount = Math.round(subtotal * taxRate)
  const total = subtotal + taxAmount

  return (
    <div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex gap-2 rounded-md border border-bloom-border p-2">
            {allowImages && (
              <div className="shrink-0">
                <input
                  ref={el => { fileInputs.current[item.id] = el }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(item.id, file); e.target.value = '' }}
                />
                {item.image_url ? (
                  <div className="group relative h-16 w-16 overflow-hidden rounded-md border border-bloom-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => update(item.id, { image_url: null })}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputs.current[item.id]?.click()}
                    disabled={uploadingId === item.id}
                    className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-bloom-border text-bloom-text-light hover:border-bloom-gold hover:text-bloom-gold"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[9px] leading-none">{uploadingId === item.id ? 'Uploading…' : 'Add'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="grid flex-1 grid-cols-12 gap-2">
              <div className="col-span-5 space-y-1">
                <Input placeholder="Item title" value={item.title} onChange={e => update(item.id, { title: e.target.value })} />
                <Input placeholder="Description (optional)" value={item.description ?? ''} onChange={e => update(item.id, { description: e.target.value || null })} className="text-xs" />
              </div>
              <div className="col-span-2">
                <Input type="number" min={0} step="0.01" placeholder="Qty" value={item.qty} onChange={e => update(item.id, { qty: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="col-span-2">
                <Input
                  type="number" min={0} step="0.01" placeholder="Unit price"
                  value={item.unit_price / 100}
                  onChange={e => update(item.id, { unit_price: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                />
              </div>
              <div className="col-span-2 flex items-center text-sm text-bloom-text-mid">
                {fmtMoney(item.qty * item.unit_price, currency)}
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(item.id)}>
                  <Trash2 className="h-4 w-4 text-bloom-text-light" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" /> Add Line Item
      </Button>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-bloom-text-mid">
            <span>Subtotal</span>
            <span>{fmtMoney(subtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-bloom-text-mid">
            <span className="flex items-center gap-1.5">
              Tax
              <Input
                type="number" min={0} max={100} step="0.1"
                value={Math.round(taxRate * 1000) / 10}
                onChange={e => onTaxRateChange((parseFloat(e.target.value) || 0) / 100)}
                className="h-7 w-16 px-1.5 text-xs"
              />
              %
            </span>
            <span>{fmtMoney(taxAmount, currency)}</span>
          </div>
          <div className="flex justify-between border-t border-bloom-border pt-1.5 font-semibold text-bloom-text">
            <span>Total</span>
            <span>{fmtMoney(total, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
