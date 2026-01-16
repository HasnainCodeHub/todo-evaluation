import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const isPublicPath = pathname === '/' || pathname === '/signin' || pathname === '/signup'

  // Session check - handle both regular and secure cookie prefixes
  const regularToken = request.cookies.get('better-auth.session_token')
  const secureToken = request.cookies.get('__Secure-better-auth.session_token')
  const hasSession = !!(regularToken || secureToken)

  // Redirect authenticated users away from auth pages
  if (hasSession && (pathname === '/signin' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to signin
  if (!hasSession && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
