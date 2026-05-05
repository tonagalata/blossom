'use client'
import { useEffect, useRef, useState } from 'react'

export default function ImagesAdmin() {
  const [uploaded, setUploaded] = useState<string[]>([])
  const [builtin, setBuiltin] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

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
        showToast(err.error || 'Upload failed')
      }
    }
    await loadImages()
    setUploading(false)
    showToast('Upload complete')
  }

  async function deleteImage(filename: string) {
    if (!confirm(`Delete ${filename}?`)) return
    await fetch(`/api/admin/images/${filename}`, { method: 'DELETE' })
    setUploaded(prev => prev.filter(u => !u.includes(filename)))
    showToast('Image deleted')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }

  if (loading) return <div className="admin-loading">Loading…</div>

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Image Library</h2>
      </div>

      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <p>Uploading…</p>
        ) : (
          <>
            <p className="upload-zone-icon">↑</p>
            <p>Drag &amp; drop images here, or click to browse</p>
            <p className="upload-zone-hint">JPG, PNG, WebP, GIF — max 6 MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          style={{ display: 'none' }}
          onChange={e => uploadFiles(e.target.files)}
        />
      </div>

      {uploaded.length > 0 && (
        <>
          <h3 className="admin-subsection-title">Uploaded</h3>
          <div className="image-library-grid">
            {uploaded.map(src => {
              const filename = src.split('/').pop() ?? src
              return (
                <div key={src} className="image-library-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={filename} />
                  <div className="image-library-overlay">
                    <button
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => deleteImage(filename)}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="image-library-name">{filename}</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      <h3 className="admin-subsection-title">Built-in</h3>
      <div className="image-library-grid">
        {builtin.map(src => (
          <div key={src} className="image-library-item image-library-item-builtin">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={src.split('/').pop()} />
            <p className="image-library-name">{src.split('/').pop()}</p>
          </div>
        ))}
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}
