import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireMember, isMemberPayload } from '@/lib/requireMember'
import { listMemberInquiries, createMemberInquiry } from '@/lib/db'

export async function GET() {
  const auth = await requireMember()
  if (!isMemberPayload(auth)) return auth

  const inquiries = await listMemberInquiries(auth.memberId)
  return NextResponse.json({ inquiries })
}

export async function POST(request: NextRequest) {
  const auth = await requireMember()
  if (!isMemberPayload(auth)) return auth

  const { subject, message } = await request.json() as Record<string, string>
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  await createMemberInquiry({ id: randomUUID(), member_id: auth.memberId, subject: subject.trim(), message: message.trim() })
  return NextResponse.json({ ok: true })
}
