// Authentication Hook for Phase 2.4
// Integrates Better Auth with JWT token generation for backend API calls

import { useState, useCallback, useEffect } from 'react'
import { authClient } from '../lib/auth/auth-client'

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

// Token storage key
const TOKEN_STORAGE_KEY = 'todo_auth_token'

export function useAuth() {
  const { data: session, isPending: sessionPending } = authClient.useSession()

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  })

  // Sync authState with Better Auth session
  useEffect(() => {
    if (!sessionPending) {
      if (session?.user) {
        // We have a session!
        const user: User = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }

        setAuthState({
          isAuthenticated: true,
          user,
          token: null, // Token handled lazily by getAuthToken
          isLoading: false,
          error: null,
        })
      } else {
        // No session
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: null,
        })
      }
    }
  }, [session, sessionPending])

  const signIn = useCallback(async (email: string, password: string, isSignUp: boolean = false) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      let result

      if (isSignUp) {
        result = await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0],
        })
      } else {
        result = await authClient.signIn.email({
          email,
          password,
        })
      }

      if (result.error) {
        throw new Error(result.error.message || 'Authentication failed')
      }

      // We don't manually set state here as useSession will update
      // and trigger our useEffect sync

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut()
    } catch {
      // Continue
    }

    // State will be updated by useEffect sync via useSession updating to null
  }, [])

  // Lazy JWT token getter for API calls
  // This is the ONLY legitimate use of /api/auth/jwt
  const getAuthToken = useCallback(async () => {
    try {
      const jwtResponse = await fetch('/api/auth/jwt', {
        credentials: 'include',
      })

      if (!jwtResponse.ok) {
        return null
      }

      const jwtData = await jwtResponse.json()
      const token = jwtData.token

      if (token) {
        setAuthState(prev => ({ ...prev, token }))
      }

      return token
    } catch (err) {
      console.error('Failed to fetch JWT token:', err)
      return null
    }
  }, [])

  return {
    authState,
    signIn,
    signOut,
    getAuthToken,
  }
}
