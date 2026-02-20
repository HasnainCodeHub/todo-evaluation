// Chat API Adapter Route
// Bridges frontend chat requests to FastAPI backend
//
// Architecture:
//   ChatPanel → POST /api/chat (this route) → FastAPI /api/chat → AI Agent → MCP → CRUD
//
// Security:
//   - Reads Better Auth session server-side (no client-side JWT exposure)
//   - Generates JWT using same BETTER_AUTH_SECRET as JWT bridge
//   - Never exposes secrets to browser

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { auth } from '@/lib/auth/auth-server'

/**
 * POST /api/chat
 *
 * Adapter route that:
 * 1. Validates Better Auth session server-side
 * 2. Generates JWT for FastAPI authentication
 * 3. Forwards message + conversation_id to FastAPI /api/chat
 * 4. Returns structured response to frontend
 *
 * RULES:
 * - No direct MCP or AI agent calls from this route
 * - All AI logic is handled by FastAPI backend
 * - JWT generated server-side only
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Validate Better Auth session (same pattern as /api/auth/jwt)
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()

    const regularToken = cookieStore.get('better-auth.session_token')
    const secureToken = cookieStore.get('__Secure-better-auth.session_token')
    const sessionToken = regularToken || secureToken

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Your session has expired — please log in again' },
        { status: 401 }
      )
    }

    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')
    const headers = new Headers()
    headers.set('cookie', cookieHeader)

    const session = await auth.api.getSession({ headers })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Your session has expired — please log in again' },
        { status: 401 }
      )
    }

    // Step 2: Generate JWT for FastAPI
    const jwtSecret = process.env.BETTER_AUTH_SECRET
    if (!jwtSecret) {
      console.error('[Chat adapter] BETTER_AUTH_SECRET not configured')
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      { sub: session.user.id, email: session.user.email },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '15m' }
    )

    // Step 3: Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const conversationId = typeof body.conversation_id === 'string' ? body.conversation_id : undefined

    if (!message) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Step 4: Forward to FastAPI backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    let fastapiResponse: Response
    try {
      fastapiResponse = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId ?? null,
        }),
      })
    } catch (fetchError) {
      console.error('[Chat adapter] Network error reaching backend:', fetchError)
      return NextResponse.json(
        { error: 'Cannot reach the server. Please try again.' },
        { status: 503 }
      )
    }

    // Handle backend 401 (session expired mid-conversation)
    if (fastapiResponse.status === 401) {
      return NextResponse.json(
        { error: 'Your session has expired — please log in again' },
        { status: 401 }
      )
    }

    if (!fastapiResponse.ok) {
      let errMessage = 'Something went wrong. Please try again.'
      try {
        const errData = await fastapiResponse.json()
        // Expose user-friendly message only, not technical details
        if (errData.detail && typeof errData.detail === 'string' && !errData.detail.includes('traceback')) {
          errMessage = errData.detail
        }
      } catch {
        // ignore parse errors
      }
      return NextResponse.json({ error: errMessage }, { status: fastapiResponse.status })
    }

    // Step 5: Return structured response
    const data = await fastapiResponse.json()
    return NextResponse.json({
      conversation_id: data.conversation_id,
      message: data.message,
      actions_taken: data.actions_taken ?? null,
      created_at: data.created_at,
    })

  } catch (error) {
    console.error('[Chat adapter] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
