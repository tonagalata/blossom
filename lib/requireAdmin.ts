import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifySessionCookie, COOKIE_NAME, type SessionUser } from './auth'
import { getAdminUserById } from './db'
import type { AdminUser } from './types'

async function resolveCurrentAdmin(): Promise<{ session: SessionUser; adminUser: AdminUser } | null> {
  const store = await cookies()
  const cookie = store.get(COOKIE_NAME)?.value
  if (!cookie) return null

  const session = await verifySessionCookie(cookie)
  if (!session) return null

  const adminUser = await getAdminUserById(session.uid)
  if (!adminUser || adminUser.disabled) return null

  return { session, adminUser }
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const resolved = await resolveCurrentAdmin()
  if (!resolved) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const resolved = await resolveCurrentAdmin()
  return resolved?.adminUser ?? null
}
