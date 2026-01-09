'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '../components/ui/Navbar'
import { Footer } from '../components/ui/Footer'
import { useAuthContext } from '../components/auth/AuthProvider'

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count.toLocaleString()}{suffix}</span>
}

// Feature card data with enhanced descriptions
const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'AI-Native Architecture',
    description: 'Built from the ground up with AI assistance. Every component designed for intelligent automation and enhancement.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Spec-Driven Development',
    description: 'Every feature backed by rigorous specifications. Predictable, documented, and maintainable codebase.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    title: 'Cloud-First Platform',
    description: 'Serverless PostgreSQL with Neon, deployed on modern infrastructure. Scale without limits.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Enterprise Security',
    description: 'Secure authentication with Better Auth. Your data is encrypted, isolated, and protected.',
    gradient: 'from-amber-500 to-orange-500',
  },
]

// How it works steps
const steps = [
  {
    number: '01',
    title: 'Define Your Tasks',
    description: 'Create tasks with rich descriptions. Organize your work with intuitive controls.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Track Progress',
    description: 'Monitor completion rates. Visual indicators show your productivity at a glance.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Achieve Goals',
    description: 'Complete tasks and celebrate wins. Build momentum with every checkmark.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
]

// Technology stack
const techStack = [
  { name: 'Next.js 14', category: 'Frontend', icon: '▲' },
  { name: 'FastAPI', category: 'Backend', icon: '⚡' },
  { name: 'TypeScript', category: 'Language', icon: '📘' },
  { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
  { name: 'Better Auth', category: 'Security', icon: '🔐' },
  { name: 'Tailwind CSS', category: 'Styling', icon: '🎨' },
]

// Stats data
const stats = [
  { value: 10000, suffix: '+', label: 'Tasks Completed' },
  { value: 99, suffix: '%', label: 'Uptime SLA' },
  { value: 50, suffix: 'ms', label: 'Avg Response' },
  { value: 5, suffix: '', label: 'Dev Phases' },
]

export default function HomePage() {
  const router = useRouter()
  const auth = useAuthContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (auth.authState.isAuthenticated) {
      router.push('/dashboard')
    }
  }, [auth.authState.isAuthenticated, router])

  return (
    <main className="min-h-screen bg-surface-50 overflow-hidden">
      <Navbar />

      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-primary-400/20 rounded-full blur-3xl top-[-400px] left-[-200px] animate-pulse-slow" />
        <div className="absolute w-[600px] h-[600px] bg-accent-400/15 rounded-full blur-3xl bottom-[-200px] right-[-100px] animate-pulse-slow animation-delay-1000" />
        <div className="absolute w-[400px] h-[400px] bg-primary-300/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full mb-8 border border-primary-200/50 ${mounted ? 'animate-fade-in-down' : 'opacity-0'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-primary-700 to-accent-700 bg-clip-text text-transparent">
              Phase 2.4 — Full Stack Todo Platform
            </span>
          </div>

          {/* Main heading */}
          <h1 className={`font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-surface-900 mb-6 leading-[1.1] tracking-tight ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="block">Spec-Driven.</span>
            <span className="block gradient-text">AI-Native.</span>
            <span className="block text-surface-700">Cloud-First.</span>
          </h1>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl text-surface-600 mb-12 max-w-3xl mx-auto leading-relaxed ${mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
            The evolution of task management. Built with modern architecture,
            powered by intelligent automation, designed for developers who ship.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 ${mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'}`}>
            <Link
              href="/signin"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-[1.02] transition-all duration-300 w-full sm:w-auto overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Start Building Free
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-surface-700 bg-white border-2 border-surface-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300 w-full sm:w-auto"
            >
              See How It Works
            </Link>
          </div>

          {/* Tech stack badges */}
          <div className={`flex flex-wrap gap-3 justify-center ${mounted ? 'animate-fade-in-up animation-delay-500' : 'opacity-0'}`}>
            {techStack.slice(0, 4).map((tech) => (
              <span
                key={tech.name}
                className="group px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-medium text-surface-700 shadow-card border border-surface-100 hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
              >
                <span className="mr-2">{tech.icon}</span>
                {tech.name}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-surface-300 rounded-full p-1">
            <div className="w-1.5 h-2.5 bg-surface-400 rounded-full mx-auto animate-fade-in-down" style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-32 px-4 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full mb-4">
              Features
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-surface-900 mb-6">
              Built for the{' '}
              <span className="gradient-text">modern developer</span>
            </h2>
            <p className="text-lg text-surface-600 max-w-2xl mx-auto">
              A complete task management platform that combines cutting-edge technology
              with elegant design. Every feature thoughtfully crafted.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative p-8 bg-white rounded-3xl border border-surface-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-surface-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-surface-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-surface-50 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 lg:py-32 px-4 bg-gradient-to-b from-surface-50 to-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-block px-4 py-1.5 bg-accent-100 text-accent-700 text-sm font-semibold rounded-full mb-4">
              How It Works
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-surface-900 mb-6">
              Productivity in{' '}
              <span className="gradient-text">three steps</span>
            </h2>
            <p className="text-lg text-surface-600 max-w-2xl mx-auto">
              Get started in seconds. No complex setup, no learning curve.
              Just powerful task management that works.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center group">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-200 to-accent-200" />
                )}

                {/* Step number */}
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm font-bold flex items-center justify-center shadow-glow">
                    {step.number.slice(-1)}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-surface-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-surface-600 max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 lg:py-32 px-4 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }} />
        </div>

        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl animate-float animation-delay-1000" style={{ animationDirection: 'reverse' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by developers
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join the community building the future of task management
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {mounted && <AnimatedCounter end={stat.value} suffix={stat.suffix} />}
                </div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="relative py-24 lg:py-32 px-4 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-surface-100 text-surface-700 text-sm font-semibold rounded-full mb-4">
              Technology
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-surface-900 mb-6">
              Modern stack for{' '}
              <span className="gradient-text">modern apps</span>
            </h2>
            <p className="text-lg text-surface-600 max-w-2xl mx-auto">
              Built with the best tools in the industry. Type-safe, performant, and scalable.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="group p-6 bg-surface-50 rounded-2xl border border-surface-100 hover:bg-white hover:border-primary-200 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </div>
                <div className="font-semibold text-surface-900 mb-1">{tech.name}</div>
                <div className="text-xs text-surface-500">{tech.category}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32 px-4 bg-surface-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-12 md:p-16 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-3xl overflow-hidden shadow-2xl">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to evolve your{' '}
                <span className="text-accent-300">productivity</span>?
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                Join the evolution. Start managing your tasks with a platform
                designed for the future.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signin"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-700 bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Get Started Free
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </div>

              <p className="mt-6 text-sm text-white/60">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
