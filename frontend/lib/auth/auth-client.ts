// Better Auth Client Configuration for Phase II
// This client handles user authentication via Better Auth

import { createAuthClient } from 'better-auth/react'

// Better Auth client uses RELATIVE paths for same-origin auth requests.
// This ensures /api/auth/* routes are called on the SAME domain (frontend),
// never hardcoded to localhost or an external URL.
// The baseURL should NOT be set - Better Auth defaults to same-origin.

// Create Better Auth client - NO baseURL means same-origin (relative) requests
export const authClient = createAuthClient()

// Export typed methods
export const signIn = (...args: any[]) => (authClient.signIn as any)(...args)
export const signUp = (...args: any[]) => (authClient.signUp as any)(...args)
export const signOut = (...args: any[]) => (authClient.signOut as any)(...args)
export const useSession = () => authClient.useSession
export const getSession = (...args: any[]) => (authClient.getSession as any)(...args)
