import { NextResponse } from 'next/server'
import { requireMember, isMemberPayload } from '@/lib/requireMember'
import { getMemberById } from '@/lib/db'

export async function GET() {
  const auth = await requireMember()
  if (!isMemberPayload(auth)) return auth

  const member = await getMemberById(auth.memberId)
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { password_hash: _, ...safe } = member
  return NextResponse.json(safe)
}
