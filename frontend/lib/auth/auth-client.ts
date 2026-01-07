// Better Auth Client Configuration for Phase II
// This client handles user authentication via Better Auth

import { createAuthClient } from 'better-auth/react'

// The baseURL for the auth client MUST be the URL of the frontend application itself.
// It must be a NEXT_PUBLIC_ variable to be available in the browser.
const authBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

if (!authBaseURL) {
  // This check is critical. In a production environment, we must have this URL.
  throw new Error("CRITICAL: NEXT_PUBLIC_BETTER_AUTH_URL environment variable is not set.");
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

