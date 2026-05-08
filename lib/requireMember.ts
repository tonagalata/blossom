import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyMemberToken, MEMBER_COOKIE, type MemberPayload } from './memberAuth'

export async function requireMember(): Promise<MemberPayload | NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get(MEMBER_COOKIE)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyMemberToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return payload
}

export function isMemberPayload(v: MemberPayload | NextResponse): v is MemberPayload {
  return 'memberId' in v
}
