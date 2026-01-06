// Authentication Hook for Phase 2.4
// Integrates Better Auth with JWT token generation for backend API calls

import { useState, useEffect, useCallback } from 'react'
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
const USER_STORAGE_KEY = 'todo_auth_user'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true, // Start with loading to check stored session
    error: null,
  })

  // Restore session from storage on mount
  // Trust localStorage for immediate display, verify session in background
  useEffect(() => {
    const restoreSession = async () => {
      const isDev = process.env.NODE_ENV === 'development'

      try {
        // Check localStorage for existing session
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
        const storedUser = localStorage.getItem(USER_STORAGE_KEY)

        if (isDev) {
          console.log('[Auth] Restoring session...')
          console.log('[Auth] Stored token exists:', !!storedToken)
          console.log('[Auth] Stored user exists:', !!storedUser)
          console.log('[Auth] Cookies:', document.cookie)
        }

        if (storedToken && storedUser) {
          // Immediately trust localStorage for fast UX
          const user = JSON.parse(storedUser)
          setAuthState({
            isAuthenticated: true,
            user,
            token: storedToken,
            isLoading: false,
            error: null,
          })

          // Verify session in background (non-blocking)
          // If verification fails, user will be signed out on next API call
          try {
            const jwtResponse = await fetch('/api/auth/jwt', {
              credentials: 'include',
            })

            if (isDev) {
              console.log('[Auth] JWT verification response:', jwtResponse.status)
            }

            if (jwtResponse.ok) {
              const jwtData = await jwtResponse.json()
              if (jwtData.token) {
                // Update with fresh token
                localStorage.setItem(TOKEN_STORAGE_KEY, jwtData.token)
                setAuthState(prev => ({
                  ...prev,
                  token: jwtData.token,
                  user: jwtData.user || prev.user,
                }))
              }
            }
            // Don't sign out on verification failure - let API calls handle it
          } catch (err) {
            // Background verification failed - ignore, let API calls handle auth
            if (isDev) {
              console.warn('Background session verification failed:', err)
            }
          }
        } else {
          // No stored session - check if Better Auth has a valid session cookie
          try {
            const jwtResponse = await fetch('/api/auth/jwt', {
              credentials: 'include',
            })

            if (isDev) {
              console.log('[Auth] Checking for Better Auth cookie session:', jwtResponse.status)
            }

            if (jwtResponse.ok) {
              const jwtData = await jwtResponse.json()
              if (jwtData.token && jwtData.user) {
                // Valid session exists - restore it
                if (isDev) {
                  console.log('[Auth] Restored session from Better Auth cookie')
                }
                localStorage.setItem(TOKEN_STORAGE_KEY, jwtData.token)
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(jwtData.user))

                setAuthState({
                  isAuthenticated: true,
                  user: jwtData.user,
                  token: jwtData.token,
                  isLoading: false,
                  error: null,
                })
                return
              }
            }
          } catch (err) {
            // No valid session - continue as unauthenticated
            if (isDev) {
              console.log('[Auth] No Better Auth session found:', err)
            }
          }
          setAuthState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (err) {
        // Clear invalid stored data
        console.error('[Auth] Session restore error:', err)
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }

    restoreSession()
  }, [])

  const signIn = useCallback(async (email: string, password: string, isSignUp: boolean = false) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      let result

      if (isSignUp) {
        // Sign up flow
        result = await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0], // Use email prefix as name
        })
      } else {
        // Sign in flow
        result = await authClient.signIn.email({
          email,
          password,
        })
      }

      if (result.error) {
        throw new Error(result.error.message || 'Authentication failed')
      }

      // Better Auth returns user data in the response
      const userData = result.data?.user || result.data

      if (!userData) {
        throw new Error('No user data returned from authentication')
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      }

      // Generate JWT token for backend API calls via API endpoint
      const jwtResponse = await fetch('/api/auth/jwt', {
        credentials: 'include',
      })
      if (!jwtResponse.ok) {
        throw new Error('Failed to generate JWT token')
      }

      const jwtData = await jwtResponse.json()
      const token = jwtData.token

      // Store session
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
        error: null,
      })
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
      // Sign out from Better Auth
      await authClient.signOut()
    } catch {
      // Continue with local sign out even if Better Auth fails
    }

    // Clear local storage
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)

    // Reset state
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
    })

    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }, [])

  const refresh = useCallback(async () => {
    // Regenerate token if user is authenticated
    if (authState.user) {
      try {
        const jwtResponse = await fetch('/api/auth/jwt', {
          credentials: 'include',
        })
        if (!jwtResponse.ok) {
          throw new Error('Failed to refresh JWT token')
        }

        const jwtData = await jwtResponse.json()
        const token = jwtData.token

        localStorage.setItem(TOKEN_STORAGE_KEY, token)

        setAuthState(prev => ({
          ...prev,
          token,
        }))
      } catch (err) {
        console.error('Token refresh failed:', err)
      }
    }
  }, [authState.user])

  return {
    authState,
    signIn,
    signOut,
    refresh,
  }
}
