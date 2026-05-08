import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail } from '@/lib/db'
import { signMemberToken, MEMBER_COOKIE } from '@/lib/memberAuth'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as Record<string, string>

  const member = await getMemberByEmail(email?.toLowerCase())
  if (!member) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, member.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const token = await signMemberToken(member.id, member.email)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
