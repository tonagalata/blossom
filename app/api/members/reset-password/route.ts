import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail, getDb } from '@/lib/db'
import { verifyResetToken } from '@/lib/memberAuth'

export async function POST(request: NextRequest) {
  const { token, newPassword } = await request.json() as { token: string; newPassword: string }

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const email = await verifyResetToken(token)
  if (!email) {
    return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 400 })
  }

  const member = await getMemberByEmail(email)
  if (!member) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
  }

  const hash = await bcrypt.hash(newPassword, 12)
  const db = await getDb()
  await db.execute({ sql: 'UPDATE members SET password_hash = ? WHERE id = ?', args: [hash, member.id] })

  return NextResponse.json({ ok: true })
}
