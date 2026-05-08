import { NextResponse } from 'next/server'
import { MEMBER_COOKIE } from '@/lib/memberAuth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MEMBER_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
