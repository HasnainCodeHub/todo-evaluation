// Custom JWT Token Generation Endpoint
// Generates JWT tokens for API authentication from Better Auth sessions
// Phase 2.4: Frontend Integration

import { auth } from '@/lib/auth/auth-server'
import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Debug logging for production troubleshooting
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log('[JWT] Request headers:', Object.fromEntries(request.headers.entries()))
      console.log('[JWT] Cookies:', request.cookies.getAll())
    }

    // Get the current session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (isDev) {
      console.log('[JWT] Session:', session ? 'Found' : 'Not found')
      if (session) {
        console.log('[JWT] User ID:', session.user?.id)
        console.log('[JWT] User email:', session.user?.email)
      }
    }

    if (!session || !session.user) {
      console.warn('[JWT] No active session found')
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Create JWT token with backend-compatible claims
    const token = jwt.sign(
      {
        sub: session.user.id, // user_id
        email: session.user.email,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.BETTER_AUTH_SECRET!,
      {
        algorithm: 'HS256',
        expiresIn: '24h',
      }
    )

    if (isDev) {
      console.log('[JWT] Token generated successfully')
    }

    return NextResponse.json({
      token,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    })
  } catch (error) {
    console.error('[JWT] Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate JWT token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
