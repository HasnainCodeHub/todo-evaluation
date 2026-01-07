// Better Auth Client Configuration for Phase 2.4
// This client handles user authentication via Better Auth
// JWT tokens are generated separately for backend API calls

import { createAuthClient } from 'better-auth/react'

// The baseURL for the auth client MUST be the URL of the frontend application itself.
const authBaseURL = process.env.BETTER_AUTH_URL;

if (!authBaseURL) {
  // This check is critical. In a production environment, we must have this URL.
  throw new Error("CRITICAL: BETTER_AUTH_URL environment variable is not set.");
}

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: authBaseURL,
})

// Export typed methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient
