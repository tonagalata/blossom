import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { deleteUploadedImage } from '@/lib/store'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const err = await requireAdmin()
  if (err) return err

  const { filename } = await params
  await deleteUploadedImage(filename)
  return NextResponse.json({ ok: true })
}
