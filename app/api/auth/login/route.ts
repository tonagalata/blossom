import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/verifyFirebaseToken'
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '@/lib/auth'
import { resolveAdminUserForLogin, touchAdminUserLogin } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { idToken } = await request.json()
  if (!idToken) {
    return NextResponse.json({ error: 'Missing ID token' }, { status: 400 })
  }

  const decoded = await verifyFirebaseIdToken(idToken)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const adminUser = await resolveAdminUserForLogin(decoded.uid, decoded.email)
  if (!adminUser || adminUser.disabled) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  await touchAdminUserLogin(adminUser.id)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
  return response
}
