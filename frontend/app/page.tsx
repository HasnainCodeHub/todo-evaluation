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

/* ---------------- DATA (UNCHANGED) ---------------- */

const features = [
  {
    title: 'AI-Native Architecture',
    description:
      'Built from the ground up with AI assistance. Every component designed for intelligent automation and enhancement.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Spec-Driven Development',
    description:
      'Every feature backed by rigorous specifications. Predictable, documented, and maintainable codebase.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Cloud-First Platform',
    description:
      'Serverless PostgreSQL with Neon, deployed on modern infrastructure. Scale without limits.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Enterprise Security',
    description:
      'Secure authentication with Better Auth. Your data is encrypted, isolated, and protected.',
    gradient: 'from-amber-500 to-orange-500',
  },
]

const techStack = [
  { name: 'Next.js', icon: '▲' },
  { name: 'FastAPI', icon: '⚡' },
  { name: 'PostgreSQL', icon: '🐘' },
  { name: 'Better Auth', icon: '🔐' },
]

const stats = [
  { value: 10000, suffix: '+', label: 'Tasks Completed' },
  { value: 99, suffix: '%', label: 'Uptime SLA' },
  { value: 50, suffix: 'ms', label: 'Avg Response' },
  { value: 5, suffix: '', label: 'Dev Phases' },
]

/* ---------------- PAGE ---------------- */

export default function HomePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Redirect authenticated users ONLY after session is resolved
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace('/dashboard')
    }
  }, [isPending, session, router])

  return (
    <main className="min-h-screen bg-surface-50 overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1
            className={`font-display text-6xl font-extrabold mb-6 ${
              mounted ? 'animate-fade-in-up' : 'opacity-0'
            }`}
          >
            Spec-Driven. <span className="gradient-text">AI-Native.</span>
          </h1>

          <p
            className={`text-xl text-surface-600 mb-12 ${
              mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
            }`}
          >
            The evolution of task management. Built for developers who ship.
          </p>

          <div
            className={`flex justify-center gap-4 ${
              mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'
            }`}
          >
            <Link
              href="/signin"
              className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border rounded-xl font-semibold"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 px-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-8 rounded-3xl border shadow-card"
            >
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-surface-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-accent-700">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-bold">
                {mounted && <AnimatedCounter end={s.value} suffix={s.suffix} />}
              </div>
              <p className="text-white/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {techStack.map((t) => (
            <div key={t.name} className="p-6 border rounded-xl">
              <div className="text-3xl">{t.icon}</div>
              <p className="font-semibold mt-2">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
