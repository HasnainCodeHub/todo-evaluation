// Better Auth Client Configuration for Phase 2.4
// This client handles user authentication via Better Auth
// JWT tokens are generated separately for backend API calls

import { createAuthClient } from 'better-auth/react'

// Lazy-initialized auth client to ensure it uses correct URLs on client-side
let _authClient: ReturnType<typeof createAuthClient> | null = null

function getAuthClient() {
  if (_authClient) {
    return _authClient
  }

  // Determine the base URL for Better Auth
  let baseURL: string

  // Check explicit environment variable first
  if (process.env.NEXT_PUBLIC_AUTH_URL) {
    baseURL = process.env.NEXT_PUBLIC_AUTH_URL
  } else if (typeof window !== 'undefined') {
    // On client-side, use current origin for same-domain auth
    baseURL = window.location.origin
  } else if (process.env.VERCEL_URL) {
    // Server-side: use Vercel URL if available
    baseURL = `https://${process.env.VERCEL_URL}`
  } else {
    // Default to localhost for development
    baseURL = 'http://localhost:3000'
  }

  _authClient = createAuthClient({ baseURL })
  return _authClient
}

// Create Better Auth client proxy that ensures lazy initialization
// This ensures the client is created with the correct URL on the client-side
export const authClient = {
  get signIn() {
    return getAuthClient().signIn
  },
  get signUp() {
    return getAuthClient().signUp
  },
  get signOut() {
    return getAuthClient().signOut
  },
  get useSession() {
    return getAuthClient().useSession
  },
  get getSession() {
    return getAuthClient().getSession
  },
}

// Export typed methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient
