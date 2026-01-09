// JWT Bridge API Route
// Converts Better Auth session to JWT for FastAPI backend authentication
// Phase 2.4: Bridge Pattern Implementation

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { auth } from '@/lib/auth/auth-server'

/**
 * GET /api/auth/jwt
 *
 * CRITICAL BRIDGE ROUTE:
 * 1. Reads Better Auth session (server-side only)
 * 2. Validates session exists
 * 3. Generates JWT for FastAPI backend
 * 4. Returns signed token
 *
 * SECURITY RULES:
 * - Runs server-side only (no client access to secrets)
 * - Uses same JWT_SECRET as backend (BETTER_AUTH_SECRET)
 * - Tokens expire in 15 minutes
 * - NO Better Auth secret exposure
 */
export async function GET(request: NextRequest) {
  try {
    // Get Better Auth session from cookies (server-side)
    const session = await auth.api.getSession({ headers: request.headers })

    // Session validation
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Extract user data from Better Auth session
    const userId = session.user.id
    const email = session.user.email

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      )
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.BETTER_AUTH_SECRET
    if (!jwtSecret) {
      console.error('[JWT Bridge] BETTER_AUTH_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Generate JWT with claims matching backend expectations
    const token = jwt.sign(
      {
        sub: userId,        // Backend expects 'sub' for user_id
        email: email,       // Backend expects 'email'
      },
      jwtSecret,
      {
        algorithm: 'HS256', // Must match backend JWT_ALGORITHM
        expiresIn: '15m',   // Token valid for 15 minutes
      }
    )

    // Return JWT to frontend
    return NextResponse.json({ token })

  } catch (error) {
    console.error('[JWT Bridge] Error generating token:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    )
  }
}
