import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie, COOKIE_NAME } from '@/lib/auth'
import { getAdminUserById } from '@/lib/db'

// Node runtime for the Turso (@libsql/client) admin_users lookup below.
export const runtime = 'nodejs'

export const config = {
  matcher: ['/admin/:path*'],
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value
  const session = cookie ? await verifySessionCookie(cookie) : null
  const adminUser = session ? await getAdminUserById(session.uid) : null

  if (!adminUser || adminUser.disabled) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
