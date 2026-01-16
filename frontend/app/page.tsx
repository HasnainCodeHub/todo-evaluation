'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '../components/ui/Navbar'
import { Footer } from '../components/ui/Footer'
import { useSession } from '@/lib/auth/auth-client'

// Animated counter component
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

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-8 border border-surface-100 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-6`}>
        {icon}
      </div>
      <h3 className="relative text-xl font-bold text-surface-900 mb-3">{title}</h3>
      <p className="relative text-surface-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Tech stack item
function TechItem({ name, icon, description }: { name: string; icon: string; description: string }) {
  return (
    <div className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all duration-300">
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <p className="font-semibold text-surface-900">{name}</p>
      <p className="text-sm text-surface-500 text-center mt-1">{description}</p>
    </div>
  )
}

// Testimonial card
function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-surface-100 shadow-card">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <p className="text-surface-700 mb-6 italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-surface-900">{author}</p>
        <p className="text-sm text-surface-500">{role}</p>
      </div>
    </div>
  )
}

/* ---------------- DATA ---------------- */

const features = [
  {
    icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    title: 'AI-Native Architecture',
    description: 'Built from the ground up with AI assistance. Every component designed for intelligent automation and enhancement.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    title: 'Spec-Driven Development',
    description: 'Every feature backed by rigorous specifications. Predictable, documented, and maintainable codebase.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
    title: 'Cloud-First Platform',
    description: 'Serverless PostgreSQL with Neon, deployed on modern infrastructure. Scale without limits.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
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

  useEffect(() => {
    setMounted(true)
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
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-card border border-surface-100 mb-8 ${mounted ? 'animate-fade-in-down' : 'opacity-0'}`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-sm font-medium text-surface-600">Now in Phase II - Production Ready</span>
          </div>

          {/* Main heading */}
          <h1 className={`font-display text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Spec-Driven.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500">
              AI-Native.
            </span>
          </h1>

          <p className={`text-xl md:text-2xl text-surface-600 mb-12 max-w-2xl mx-auto leading-relaxed ${mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
            The evolution of task management. Built for developers who ship.
            <span className="block mt-2 text-lg text-surface-500">Modern • Fast • Secure</span>
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row justify-center gap-4 ${mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'}`}>
            <Link
              href="/signin?mode=signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-surface-700 border-2 border-surface-200 rounded-xl font-semibold hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>

          {/* Trust badges */}
          <div className={`mt-16 flex flex-wrap justify-center items-center gap-8 ${mounted ? 'animate-fade-in-up animation-delay-500' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 text-surface-500">
              <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-surface-500">
              <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Free forever plan</span>
            </div>
            <div className="flex items-center gap-2 text-surface-500">
              <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Setup in 30 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 text-sm font-semibold rounded-full mb-4">Features</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-surface-900 mb-4">
              Everything you need to <span className="gradient-text">ship faster</span>
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              Built with modern technologies and best practices for maximum productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Trusted by developers worldwide
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of developers who have upgraded their task management workflow.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label} className="p-6">
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                  {mounted && <AnimatedCounter end={s.value} suffix={s.suffix} />}
                </div>
                <p className="text-white/70 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 bg-surface-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-accent-50 text-accent-700 text-sm font-semibold rounded-full mb-4">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-surface-900 mb-4">
              Get started in <span className="gradient-text">three simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up in seconds with just your email. No credit card required.',
                icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              },
              {
                step: '02',
                title: 'Add Your Tasks',
                description: 'Create tasks with titles and descriptions. Organize your work instantly.',
                icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              },
              {
                step: '03',
                title: 'Track Progress',
                description: 'Mark tasks complete, filter by status, and watch your productivity soar.',
                icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-surface-100 shadow-card hover:shadow-card-hover transition-all duration-300 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg">
                      {item.icon}
                    </div>
                    <span className="text-5xl font-bold text-surface-100">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-3">{item.title}</h3>
                  <p className="text-surface-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <svg className="w-8 h-8 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <section id="technology" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-surface-100 text-surface-700 text-sm font-semibold rounded-full mb-4">Technology</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-surface-900 mb-4">
              Built with the <span className="gradient-text">best stack</span>
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
      <section className="py-24 bg-surface-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-success-50 text-success-700 text-sm font-semibold rounded-full mb-4">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-surface-900 mb-4">
              Loved by <span className="gradient-text">developers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to evolve your workflow?
          </h2>
          <p className="text-xl text-surface-300 mb-10 max-w-2xl mx-auto">
            Join developers who have transformed their productivity with Evolution of Todo.
          </p>
          <Link
            href="/signin?mode=signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-surface-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
          >
            Start Free Today
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-6 text-surface-400 text-sm">No credit card required • Free forever plan available</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
