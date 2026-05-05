import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { listUploadedImages, listBuiltinImages } from '@/lib/store'

export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const [uploaded, builtin] = await Promise.all([listUploadedImages(), listBuiltinImages()])
  return NextResponse.json({ uploaded, builtin })
}
