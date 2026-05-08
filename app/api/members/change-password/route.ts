import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireMember, isMemberPayload } from '@/lib/requireMember'
import { getMemberById } from '@/lib/db'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  const auth = await requireMember()
  if (!isMemberPayload(auth)) return auth

  const { currentPassword, newPassword } = await request.json() as Record<string, string>

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both fields are required.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const member = await getMemberById(auth.memberId)
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, member.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 12)
  const db = await getDb()
  await db.execute({ sql: 'UPDATE members SET password_hash = ? WHERE id = ?', args: [hash, member.id] })

  return NextResponse.json({ ok: true })
}
