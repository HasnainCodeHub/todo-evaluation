'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { User, AuthState } from '../../hooks/useAuth'

interface AuthContextType {
  authState: AuthState
  signIn: (email: string, password: string, isSignUp?: boolean) => Promise<void>
  signOut: () => void
  getAuthToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

// Re-export types for convenience
export type { User, AuthState }
