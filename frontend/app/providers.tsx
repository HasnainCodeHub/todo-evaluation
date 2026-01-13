"use client"

import { ReactNode } from "react"
import { AuthProvider } from "../components/auth/AuthProvider"

/**
 * Root Providers Component
 *
 * CRITICAL: This component wraps all application providers at the root level.
 * Must be a client component to enable client-side auth state hydration.
 *
 * Provider Order:
 * 1. AuthProvider - Better Auth session state (outermost)
 * 2. Future providers can be added here
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
