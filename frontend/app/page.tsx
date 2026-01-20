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
function TechItem({ name, icon, category }: { name: string; icon: string; category: string }) {
  return (
    <div className="group p-6 bg-surface-50 rounded-2xl border border-surface-100 hover:bg-white hover:border-primary-200 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 text-center">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="font-semibold text-surface-900 mb-1">{name}</div>
      <div className="text-xs text-surface-500">{category}</div>
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
  { name: 'Next.js 14', category: 'Frontend', icon: '▲' },
  { name: 'FastAPI', category: 'Backend', icon: '⚡' },
  { name: 'TypeScript', category: 'Language', icon: '📘' },
  { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
  { name: 'Better Auth', category: 'Security', icon: '🔐' },
  { name: 'Tailwind CSS', category: 'Styling', icon: '🎨' },
]

const stats = [
  { value: 10000, suffix: '+', label: 'Tasks Completed' },
  { value: 99, suffix: '%', label: 'Uptime SLA' },
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {stats.map((s, index) => (
              <div
                key={s.label}
                className="relative p-4 md:p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10
                  hover:bg-white/15 hover:border-white/20 transition-all duration-500 group overflow-hidden"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300 tabular-nums">
                  {mounted && <AnimatedCounter end={s.value} suffix={s.suffix} />}
                </div>
                <p className="text-white/70 font-medium text-sm md:text-lg">{s.label}</p>

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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
