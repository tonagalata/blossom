import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie, COOKIE_NAME } from '@/lib/auth'

// Deliberately no DB lookup here: Netlify's Next.js plugin doesn't allow
// native C++ addons in Middleware (Edge or "Node.js" middleware alike), and
// @libsql/client (Turso) pulls in a native binding that trips this even when
// only imported. So middleware does the cheap, edge-safe check — is there a
// validly signed, unexpired Firebase session at all — and the authoritative
// "is this uid still an active admin_users row" check happens where a normal
// Node serverless function runs it: requireAdmin()/getCurrentAdmin() in every
// admin API route, and directly in app/admin/page.tsx for the one dashboard
// page that reads the DB straight from a server component.
export const config = {
  matcher: ['/admin/:path*'],
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value
  const session = cookie ? await verifySessionCookie(cookie) : null

  if (!session) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
