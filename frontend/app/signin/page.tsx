'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '../../components/auth/AuthProvider'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'signin'
  const isSignUp = mode === 'signup'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasRedirected = useRef(false)

  const auth = useAuthContext()
  const { authState } = auth

  // Handle redirect for authenticated users - use useEffect to avoid render-loop
  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true
      setIsRedirecting(true)
      router.push('/dashboard')
    }
  }, [authState.isLoading, authState.isAuthenticated, router])

  // Show loading while auth state is resolving
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting state (controlled by useEffect, not render-time logic)
  if (isRedirecting || authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await auth.signIn(email, password, isSignUp)
      // Set redirecting state and let useEffect handle the redirect
      hasRedirected.current = true
      setIsRedirecting(true)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-surface-50 overflow-hidden">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 overflow-hidden">
        {/* Background shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="floating-shape w-96 h-96 bg-white/20 top-0 -left-48" style={{ animation: 'float 20s ease-in-out infinite' }} />
          <div className="floating-shape w-80 h-80 bg-accent-400/30 bottom-0 right-0" style={{ animation: 'float 25s ease-in-out infinite reverse' }} />
          <div className="floating-shape w-64 h-64 bg-white/10 top-1/2 left-1/2" style={{ animation: 'float 22s ease-in-out infinite' }} />
        </div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-display font-bold text-2xl text-white">Evolution of Todo</span>
          </Link>

          <h2 className="font-display text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Manage your tasks
            <br />
            <span className="text-white/80">with elegance.</span>
          </h2>

          <p className="text-lg text-white/70 mb-12 max-w-md">
            Join thousands of users who trust our platform for their daily task management. Simple, secure, and beautiful.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            {[
              'Secure JWT authentication',
              'Real-time task updates',
              'Beautiful, responsive design',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-surface-900">Evolution of Todo</span>
          </Link>

          {/* Form header */}
          <div className="text-center lg:text-left mb-10">
            <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-surface-600">
              {isSignUp
                ? 'Start managing your tasks today'
                : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="input-modern"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="input-modern"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-sm text-surface-400">or</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          {/* Toggle mode */}
          <div className="text-center">
            {isSignUp ? (
              <p className="text-surface-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/signin?mode=signin')}
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-surface-600">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/signin?mode=signup')}
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
