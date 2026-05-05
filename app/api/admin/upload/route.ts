import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { saveUploadedImage } from '@/lib/store'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 6 * 1024 * 1024 // 6 MB

export async function POST(request: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 6 MB)' }, { status: 400 })
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const url = await saveUploadedImage(filename, buffer, file.type)

    return NextResponse.json({ url, filename })
  } catch (e) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    console.error('upload_failed', {
      id,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal upload error', id }, { status: 500 })
  }
}
