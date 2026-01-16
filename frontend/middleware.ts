import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Public routes that don't require authentication
    const publicPaths = ['/', '/signin', '/signup']
    const isPublicPath = publicPaths.includes(pathname)

    // Get the session token from cookies
    // Check both regular and secure cookie names (production uses __Secure- prefix)
    const sessionToken = request.cookies.get('better-auth.session_token')
      || request.cookies.get('__Secure-better-auth.session_token')
    const hasSession = !!sessionToken

    // Redirect authenticated users away from auth pages to dashboard
    if (hasSession && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect unauthenticated users to signin page
    if (!hasSession && !isPublicPath) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('[Middleware] Error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
