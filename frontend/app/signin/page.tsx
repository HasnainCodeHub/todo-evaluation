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
  const [passwordTouched, setPasswordTouched] = useState(false)

  const pwRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passwordValid = pwRules.length && pwRules.upper && pwRules.number

  useEffect(() => {
    if (!isPending && session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      window.location.href = '/dashboard'
    }
  }, [isPending, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isSignUp && !passwordValid) {
      setPasswordTouched(true)
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const result = await signUp.email({ email, password, name })
        if (result?.error) {
          setError(result.error.message ?? 'Sign up failed. Please try again.')
          setLoading(false)
          return
        }
      } else {
        const result = await signIn.email({ email, password })
        if (result?.error) {
          setError(result.error.message ?? 'Invalid email or password.')
          setLoading(false)
          return
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex items-center gap-3 text-white/50">
          <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
          Redirecting to dashboard...
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex bg-surface-950">
      {/* ── Left Panel (decorative, desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-900 border-r border-white/[0.06]">
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_40%,rgba(139,92,246,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_70%_70%,rgba(6,182,212,0.06),transparent)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-white">Evolution of Todo</span>
          </Link>

          {/* Headline */}
          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white mb-5 leading-tight">
            Manage your tasks<br />
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              with AI.
            </span>
          </h1>

          <p className="text-white/40 text-base mb-10 max-w-sm leading-relaxed">
            Join engineers who manage their entire backlog through natural language — no forms, no friction.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              'AI-native architecture for smart automation',
              'Spec-driven development for reliability',
              'Cloud-first platform with 99% uptime',
              'Enterprise-grade security built-in',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-white/60">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl text-white">Evolution of Todo</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-white/40 text-sm">
              {isSignUp
                ? 'Start managing your tasks today'
                : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/60 mb-2">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-modern"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/60 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/60 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                required
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true) }}
                className={`input-modern ${isSignUp && passwordTouched && !passwordValid ? 'border-red-500/50 focus:border-red-500' : ''}`}
              />

              {/* Live password requirements — signup only */}
              {isSignUp && passwordTouched && (
                <ul className="mt-3 space-y-1.5">
                  {[
                    { ok: pwRules.length, label: 'At least 8 characters' },
                    { ok: pwRules.upper,  label: 'At least one uppercase letter' },
                    { ok: pwRules.number, label: 'At least one number' },
                  ].map(({ ok, label }) => (
                    <li key={label} className="flex items-center gap-2 text-xs">
                      {ok ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* All requirements met — show success hint */}
              {isSignUp && passwordTouched && passwordValid && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Password looks good
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (isSignUp && passwordTouched && !passwordValid)}
              className="btn-gradient w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-8 text-center text-sm text-white/40">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/signin?mode=signin')}
                  className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => router.push('/signin?mode=signup')}
                  className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Create account
                </button>
              </>
            )}
          </p>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
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
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
