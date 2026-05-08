import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { getMemberByEmail, createMember } from '@/lib/db'
import { signMemberToken, MEMBER_COOKIE } from '@/lib/memberAuth'

export async function POST(request: NextRequest) {
  const { email, password, firstName, lastName } = await request.json() as Record<string, string>

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Email and password (min 8 chars) are required.' }, { status: 400 })
  }

  const existing = await getMemberByEmail(email.toLowerCase())
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const id = randomUUID()
  const hash = await bcrypt.hash(password, 12)

  await createMember({
    id,
    email: email.toLowerCase(),
    first_name: firstName?.trim() || null,
    last_name: lastName?.trim() || null,
    password_hash: hash,
  })

  const token = await signMemberToken(id, email.toLowerCase())
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
