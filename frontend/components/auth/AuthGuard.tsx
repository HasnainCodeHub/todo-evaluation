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
  const [timedOut, setTimedOut] = useState(false)

  // Safety timeout: if auth hasn't resolved in 8 seconds, show an error/fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPending) {
        console.warn("[AuthGuard] Session resolution timed out after 8s.")
        setTimedOut(true)
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [isPending])

  useEffect(() => {
    // Only redirect once we explicitly know there is No session
    if (!isPending && !session?.user) {
      console.log("[AuthGuard] No session found, redirecting to /signin")
      router.replace("/signin")
    }
  }, [isPending, session, router])

  // While loading, show a neutral loading state
  if (isPending && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying your session...</p>
          <p className="text-gray-400 text-sm mt-2">Checking secure connection</p>
        </div>
      </div>
    )
  }

  // Fallback for hang state (e.g. database unreachable or cookie blocked)
  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Session Sync Issue</h2>
          <p className="text-gray-600 mb-6">
            We're having trouble connecting to the authentication service. This usually happens if cookies are disabled or the session has expired.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-3"
          >
            Try Refreshing
          </button>
          <button
            onClick={() => router.push('/signin')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Go to Sign In
          </button>
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
