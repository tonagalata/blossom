import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from './auth'

export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
