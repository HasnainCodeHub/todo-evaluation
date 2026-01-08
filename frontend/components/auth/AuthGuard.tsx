"use client"

import { useSession } from "../../lib/auth/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * AuthGuard - Production-grade route guard for protected pages.
 *
 * CRITICAL:
 * 1. ONLY relies on Better Auth session state.
 * 2. NEVER calls /api/auth/jwt or any backend APIs for routing decisions.
 * 3. Shows loading state while session is resolving.
 * 4. Redirects to /signin if session is missing.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once we explicitly know there is No session
    if (!isPending && !session?.user) {
      console.log("[AuthGuard] No session found, redirecting to /signin")
      router.replace("/signin")
    }
  }, [isPending, session, router])

  // While loading, show a neutral loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying your session...</p>
        </div>
      </div>
    )
  }

  // Handle explicit error states from useSession
  if (error) {
    console.error("[AuthGuard] BetterAuth error:", error)
    router.replace("/signin")
    return null
  }

  // If no session, show nothing (useEffect will handle redirect)
  if (!session?.user) {
    return null
  }

  // session exists, render children
  return <>{children}</>
}
