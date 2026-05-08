import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { markInquiryRead, deleteInquiry } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  await markInquiryRead(id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  await deleteInquiry(id)
  return NextResponse.json({ ok: true })
}
