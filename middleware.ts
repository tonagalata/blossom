import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/auth'

export const config = {
  matcher: ['/admin/:path*'],
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyAdminToken(token))) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
