import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { replyToMemberInquiry } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin()
  if (err) return err

  const { id } = await params
  const { reply } = await request.json() as { reply: string }
  if (!reply?.trim()) return NextResponse.json({ error: 'Reply is required' }, { status: 400 })

  await replyToMemberInquiry(id, reply.trim())
  return NextResponse.json({ ok: true })
}
