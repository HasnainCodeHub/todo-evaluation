'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '../components/ui/Navbar'
import { Footer } from '../components/ui/Footer'
import { useSession } from '@/lib/auth/auth-client'

// Animated counter component with easing
function AnimatedCounter({
  end,
  duration = 2000,
  suffix = '',
}: {
  end: number
  duration?: number
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let startTime: number
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            setCount(Math.floor(easeOutQuart * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// Premium Feature card component with gradient border
function FeatureCard({
  icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  index: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-surface-100/80
        shadow-xl transition-all duration-700 ease-out overflow-hidden
        hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-200/50
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icon container with gradient */}
      <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-6
        group-hover:scale-110 group-hover:shadow-xl transition-all duration-500`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
        {icon}
      </div>

      <h3 className="relative text-xl font-bold text-surface-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
        {title}
      </h3>
      <p className="relative text-surface-600 leading-relaxed group-hover:text-surface-700 transition-colors duration-300">
        {description}
      </p>

      {/* Arrow indicator */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  )
}

// Tech stack item with hover animation
function TechItem({ name, icon, description }: { name: string; icon: string; description: string }) {
  return (
    <div className="group flex flex-col items-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-surface-100/80 shadow-lg
      hover:shadow-xl hover:border-primary-200 hover:-translate-y-2 transition-all duration-500">
      <div className="relative mb-4">
        <div className="text-5xl group-hover:scale-125 transition-transform duration-500">{icon}</div>
        <div className="absolute inset-0 bg-primary-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <p className="font-bold text-surface-900 mb-1">{name}</p>
      <p className="text-sm text-surface-500 text-center">{description}</p>
    </div>
  )
}

// Premium Testimonial card
function TestimonialCard({ quote, author, role, index }: { quote: string; author: string; role: string; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-surface-100/80 shadow-xl
        transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl overflow-hidden
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl" />

      {/* Star rating with animation */}
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="w-5 h-5 text-amber-400 fill-current animate-pop"
            style={{ animationDelay: `${i * 100}ms` }}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>

      <p className="relative text-surface-700 mb-6 italic text-lg leading-relaxed">"{quote}"</p>

      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-surface-900">{author}</p>
          <p className="text-sm text-surface-500">{role}</p>
        </div>
      </div>
    </div>
  )
}

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? '#8b5cf6' : '#06b6d4',
            animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ---------------- DATA ---------------- */

const features = [
  {
    icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    title: 'AI-Native Architecture',
    description: 'Built from the ground up with AI assistance. Every component designed for intelligent automation and enhancement.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    title: 'Spec-Driven Development',
    description: 'Every feature backed by rigorous specifications. Predictable, documented, and maintainable codebase.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
    title: 'Cloud-First Platform',
    description: 'Serverless PostgreSQL with Neon, deployed on modern infrastructure. Scale without limits.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    title: 'Enterprise Security',
    description: 'Secure authentication with Better Auth. Your data is encrypted, isolated, and protected.',
    gradient: 'from-amber-500 to-orange-500',
  },
]

const techStack = [
  { name: 'Next.js 15', icon: '▲', description: 'React Framework' },
  { name: 'FastAPI', icon: '⚡', description: 'Python Backend' },
  { name: 'PostgreSQL', icon: '🐘', description: 'Neon Serverless' },
  { name: 'Better Auth', icon: '🔐', description: 'Authentication' },
]

const stats = [
  { value: 10000, suffix: '+', label: 'Tasks Completed' },
  { value: 99.9, suffix: '%', label: 'Uptime SLA' },
  { value: 50, suffix: 'ms', label: 'Avg Response' },
  { value: 5, suffix: '', label: 'Dev Phases' },
]

const testimonials = [
  {
    quote: "Evolution of Todo transformed how our team manages tasks. The AI-native approach is game-changing.",
    author: "Sarah Chen",
    role: "Engineering Lead, TechCorp"
  },
  {
    quote: "Finally, a task manager built by developers, for developers. The spec-driven approach ensures quality.",
    author: "Marcus Johnson",
    role: "Senior Developer, StartupXYZ"
  },
  {
    quote: "The performance is incredible. 50ms response times make task management feel instant.",
    author: "Emily Rodriguez",
    role: "Product Manager, InnovateCo"
  },
]

/* ---------------- PAGE ---------------- */

export default function HomePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Redirect authenticated users
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace('/dashboard')
    }
  }, [isPending, session, router])

  return (
    <main className="min-h-screen bg-surface-50 overflow-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-20">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient orb */}
          <div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/30 to-violet-500/20 rounded-full blur-3xl animate-blob"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          {/* Secondary gradient orb */}
          <div
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-accent-500/25 to-cyan-500/15 rounded-full blur-3xl animate-blob animation-delay-2000"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          />
          {/* Center gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-pink-500/10 rounded-full blur-3xl" />

          {/* Floating particles */}
          <FloatingParticles />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 grid-pattern opacity-50" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge with glow */}
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-surface-100/80 mb-8
            ${mounted ? 'animate-fade-in-down' : 'opacity-0'}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-primary-500 to-primary-600"></span>
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Now in Phase II - Production Ready
            </span>
          </div>

          {/* Main heading with gradient animation */}
          <h1 className={`font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight
            ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="text-surface-900">Spec-Driven.</span>{' '}
            <span className="gradient-text-aurora">
              AI-Native.
            </span>
          </h1>

          <p className={`text-xl md:text-2xl text-surface-600 mb-12 max-w-3xl mx-auto leading-relaxed text-balance
            ${mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
            The evolution of task management. Built for developers who ship.
            <span className="block mt-3 text-lg text-surface-500 font-medium">
              Modern • Fast • Secure • Beautiful
            </span>
          </p>

          {/* CTA Buttons with enhanced styling */}
          <div className={`flex flex-col sm:flex-row justify-center gap-4 mb-12
            ${mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'}`}>
            <Link
              href="/signin?mode=signup"
              className="group relative px-10 py-5 rounded-2xl font-bold text-lg text-white overflow-hidden transition-all duration-300
                shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Gradient background */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-[length:200%_100%] animate-gradient-x" />
              {/* Hover overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Shine effect */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <span className="relative flex items-center justify-center gap-3">
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>

            <Link
              href="#features"
              className="group relative px-10 py-5 bg-white/90 backdrop-blur-sm text-surface-700 border-2 border-surface-200/80 rounded-2xl font-bold text-lg
                shadow-lg hover:border-primary-300 hover:bg-white hover:text-primary-700 hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                Learn More
                <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Trust badges with icons */}
          <div className={`flex flex-wrap justify-center items-center gap-8 ${mounted ? 'animate-fade-in-up animation-delay-500' : 'opacity-0'}`}>
            {[
              { text: 'No credit card required', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { text: 'Free forever plan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { text: 'Setup in 30 seconds', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-surface-500 hover:text-surface-700 transition-colors">
                <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badge.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 ${mounted ? 'animate-bounce-gentle' : 'opacity-0'}`}>
          <div className="w-6 h-10 rounded-full border-2 border-surface-300 flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 bg-surface-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 dot-pattern opacity-30" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100/80 text-primary-700 text-sm font-semibold rounded-full mb-6 border border-primary-200/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Features
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-surface-900 mb-6 text-balance">
              Everything you need to{' '}
              <span className="gradient-text">ship faster</span>
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto leading-relaxed">
              Built with modern technologies and best practices for maximum productivity and developer happiness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-32 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
              Trusted by developers{' '}
              <span className="text-accent-300">worldwide</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of developers who have upgraded their task management workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, index) => (
              <div
                key={s.label}
                className="relative p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10
                  hover:bg-white/15 hover:border-white/20 transition-all duration-500 group"
              >
                <div className="text-5xl md:text-6xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300">
                  {mounted && <AnimatedCounter end={s.value} suffix={s.suffix} />}
                </div>
                <p className="text-white/70 font-medium text-lg">{s.label}</p>

                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-l-2xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-32 bg-surface-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-50 to-accent-100/80 text-accent-700 text-sm font-semibold rounded-full mb-6 border border-accent-200/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-surface-900 mb-6">
              Get started in{' '}
              <span className="gradient-text">three simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up in seconds with just your email. No credit card required.',
                icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                color: 'from-violet-500 to-purple-600'
              },
              {
                step: '02',
                title: 'Add Your Tasks',
                description: 'Create tasks with titles and descriptions. Organize your work instantly.',
                icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '03',
                title: 'Track Progress',
                description: 'Mark tasks complete, filter by status, and watch your productivity soar.',
                icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                color: 'from-emerald-500 to-teal-500'
              },
            ].map((item, index) => (
              <div key={item.step} className="relative group">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-surface-100/80 shadow-xl
                  hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg
                      group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      {item.icon}
                    </div>
                    <span className="text-6xl font-bold text-surface-100 group-hover:text-surface-200 transition-colors duration-300">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-3">{item.title}</h3>
                  <p className="text-surface-600 leading-relaxed">{item.description}</p>
                </div>

                {/* Connector arrow */}
                {index < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10
                    text-surface-300 group-hover:text-primary-400 transition-colors duration-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section id="technology" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-20" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 text-sm font-semibold rounded-full mb-6 border border-surface-200/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Technology
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-surface-900 mb-6">
              Built with the{' '}
              <span className="gradient-text">best stack</span>
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              Modern technologies chosen for performance, reliability, and developer experience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {techStack.map((tech) => (
              <TechItem key={tech.name} {...tech} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-32 bg-surface-50 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-success-50 to-success-100/80 text-success-700 text-sm font-semibold rounded-full mb-6 border border-success-200/50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-surface-900 mb-6">
              Loved by{' '}
              <span className="gradient-text">developers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900" />

        {/* Animated gradient orb */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-pink-500/10 rounded-full blur-3xl animate-aurora" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-8">
            Ready to evolve your{' '}
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
              workflow?
            </span>
          </h2>
          <p className="text-xl text-surface-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join developers who have transformed their productivity with Evolution of Todo.
            Start free today.
          </p>

          <Link
            href="/signin?mode=signup"
            className="group inline-flex items-center gap-3 px-12 py-6 bg-white text-surface-900 rounded-2xl font-bold text-xl
              shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)] hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
          >
            Start Free Today
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <p className="mt-8 text-surface-400 text-sm flex items-center justify-center gap-4">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No credit card required
            </span>
            <span className="w-1 h-1 bg-surface-600 rounded-full" />
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Free forever plan
            </span>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
