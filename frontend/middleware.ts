import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // #region agent log - Absolute minimum
  const pathname = request.nextUrl.pathname
  console.error('[MW]', pathname)

  // Public routes
  const isPublicPath = pathname === '/' || pathname === '/signin' || pathname === '/signup'
  
  // Session check
  const regularToken = request.cookies.get('better-auth.session_token')
  const secureToken = request.cookies.get('__Secure-better-auth.session_token')
  const hasSession = !!(regularToken || secureToken)
  
  console.error('[MW]', isPublicPath, hasSession)

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
  // #endregion

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
