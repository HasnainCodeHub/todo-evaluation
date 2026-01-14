'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession, signIn, signUp } from '@/lib/auth/auth-client'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'signin'
  const isSignUp = mode === 'signup'

  const { data: session, isPending } = useSession()
  const hasRedirected = useRef(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect once authenticated
  useEffect(() => {
    if (!isPending && session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      window.location.href = '/dashboard'
    }
  }, [isPending, session])

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp.email({
          email,
          password,
          name,
        })
      } else {
        await signIn.email({
          email,
          password,
        })
      }
      // Redirect handled by session effect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Redirecting…
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 px-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isSignUp ? 'Create account' : 'Welcome back'}
        </h1>

        {error && (
          <div className="mb-4 p-3 text-sm bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-modern"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-modern"
          />

          <input
            type="password"
            placeholder="Password"
            required
            minLength={8}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-modern"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full"
          >
            {loading ? 'Processing…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => router.push('/signin?mode=signin')}
                className="text-primary-600 font-semibold"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{' '}
              <button
                onClick={() => router.push('/signin?mode=signup')}
                className="text-primary-600 font-semibold"
              >
                Create account
              </button>
            </>
          )}
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-surface-500">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  )
}
