'use client'

import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/cn'
import { UploadCloud, Trash2 } from 'lucide-react'

export default function ImagesAdmin() {
  const [uploaded, setUploaded] = useState<string[]>([])
  const [builtin, setBuiltin] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadImages() {
    const res = await fetch('/api/admin/images')
    const data = await res.json()
    setUploaded(data.uploaded)
    setBuiltin(data.builtin)
    setLoading(false)
  }

  useEffect(() => { loadImages() }, [])

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Upload failed')
      }
    }
    await loadImages()
    setUploading(false)
    toast.success('Upload complete')
  }

  async function deleteImage(filename: string) {
    if (!confirm(`Delete ${filename}?`)) return
    await fetch(`/api/admin/images/${filename}`, { method: 'DELETE' })
    setUploaded(prev => prev.filter(u => !u.includes(filename)))
    toast.success('Image deleted')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }

  if (loading) return <p className="text-sm text-bloom-text-mid">Loading…</p>

  return (
    <div>
      <PageHeader title="Image Library" description="Upload and manage images used across the site." />

      <div
        className={cn(
          'mb-8 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-12 text-center text-sm text-bloom-text-mid transition-colors',
          dragOver ? 'border-bloom-gold bg-bloom-gold/5' : 'border-bloom-border'
        )}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <p>Uploading…</p>
        ) : (
          <>
            <UploadCloud className="mb-1 h-6 w-6 text-bloom-text-light" />
            <p>Drag &amp; drop images here, or click to browse</p>
            <p className="text-xs text-bloom-text-light">JPG, PNG, WebP, GIF — max 6 MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={e => uploadFiles(e.target.files)}
        />
      </div>

      {uploaded.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-semibold text-bloom-text">Uploaded</h3>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {uploaded.map(src => {
              const filename = src.split('/').pop() ?? src
              return (
                <div key={src} className="group relative overflow-hidden rounded-lg border border-bloom-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={filename} className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="destructive" size="sm" onClick={() => deleteImage(filename)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                  </div>
                  <p className="truncate px-2 py-1 text-xs text-bloom-text-mid">{filename}</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      <h3 className="mb-3 text-sm font-semibold text-bloom-text">Built-in</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {builtin.map(src => (
          <div key={src} className="overflow-hidden rounded-lg border border-bloom-border bg-white opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={src.split('/').pop()} className="aspect-square w-full object-cover" />
            <p className="truncate px-2 py-1 text-xs text-bloom-text-mid">{src.split('/').pop()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
