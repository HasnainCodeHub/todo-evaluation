'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Navbar } from '../components/ui/Navbar'
import { Footer } from '../components/ui/Footer'

/* ─────────────────────────────────────────────
   Animated counter (intersection-observer)
───────────────────────────────────────────── */
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        setStarted(true)
        let t0: number
        const tick = (t: number) => {
          if (!t0) t0 = t
          const p = Math.min((t - t0) / duration, 1)
          setCount(Math.floor((1 - Math.pow(1 - p, 4)) * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration, started])

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>
}

/* ─────────────────────────────────────────────
   Section badge
───────────────────────────────────────────── */
function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 border bg-white/5 text-white/50 border-white/10">
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Feature card
───────────────────────────────────────────── */
function FeatureCard({ icon, title, description, index }: {
  icon: React.ReactNode; title: string; description: string; index: number
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10
        transition-all duration-500 overflow-hidden
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Stat card
───────────────────────────────────────────── */
function StatCard({ value, suffix, label, mounted }: { value: number; suffix: string; label: string; mounted: boolean }) {
  return (
    <div className="text-center px-4 py-8 border-r border-white/5 last:border-0">
      <div className="text-4xl md:text-5xl font-bold text-white mb-1 tabular-nums">
        {mounted ? <AnimatedCounter end={value} suffix={suffix} /> : '0'}
      </div>
      <p className="text-sm text-white/40 font-medium">{label}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Step card
───────────────────────────────────────────── */
function StepCard({ step, title, description, index }: { step: string; title: string; description: string; index: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-5">
        <div className="flex-none w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-sm font-bold text-white/40">{step}</span>
        </div>
        <div className="pt-1">
          <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-white/40 leading-relaxed">{description}</p>
        </div>
      </div>
      {index < 2 && <div className="absolute left-5 top-12 bottom-0 w-px bg-white/10" style={{ height: 'calc(100% - 12px)' }} />}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Testimonial
───────────────────────────────────────────── */
function TestimonialCard({ quote, author, role, company, index }: {
  quote: string; author: string; role: string; company: string; index: number
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`p-6 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      <p className="text-white/60 text-sm leading-relaxed mb-5">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-none">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{author}</p>
          <p className="text-xs text-white/40">{role} · {company}</p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const features = [
  {
    icon: <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    title: 'AI Chat Interface',
    description: 'Manage all your tasks through natural language. Just tell the AI what you need — no forms required.',
  },
  {
    icon: <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>,
    title: 'MCP Integration',
    description: 'Powered by Model Context Protocol — a secure, standardised bridge between AI agents and your data.',
  },
  {
    icon: <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    title: 'Enterprise Auth',
    description: 'Better Auth sessions with JWT bridge. Every API call cryptographically signed and user-scoped.',
  },
  {
    icon: <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4" /></svg>,
    title: 'Serverless Database',
    description: 'Neon PostgreSQL auto-scales to zero. Your data is globally distributed and always available.',
  },
  {
    icon: <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    title: 'FastAPI Backend',
    description: 'Python 3.13 + FastAPI with async endpoints, automatic OpenAPI docs, and sub-50ms response times.',
  },
  {
    icon: <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    title: 'User Data Isolation',
    description: 'Strict user scoping on every query. You can only ever read, write, or delete your own tasks.',
  },
]

const stats = [
  { value: 50, suffix: 'ms', label: 'Avg response time' },
  { value: 99, suffix: '%', label: 'API uptime SLA' },
  { value: 6, suffix: '', label: 'Technology layers' },
  { value: 100, suffix: '%', label: 'User data isolated' },
]

const steps = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Sign up with email. No credit card, no onboarding call — you\'re in the dashboard in under 30 seconds.',
  },
  {
    step: '02',
    title: 'Chat with your AI assistant',
    description: 'Type "Add a task to review the Q4 report" and watch it happen. The AI understands context and intent.',
  },
  {
    step: '03',
    title: 'Track and ship faster',
    description: 'Filter, complete, update and delete tasks through natural language or traditional controls. Your choice.',
  },
]

const testimonials = [
  {
    quote: 'The MCP architecture means the AI has exactly the right level of access — no more, no less. That\'s the kind of security-first thinking we need at scale.',
    author: 'Sarah Chen',
    role: 'Engineering Lead',
    company: 'Meridian Systems',
  },
  {
    quote: 'Sub-50ms response times, zero downtime, and I can manage my entire backlog by just talking to it. This is what a modern tool should feel like.',
    author: 'Marcus Johansson',
    role: 'Senior Engineer',
    company: 'Altitude Labs',
  },
  {
    quote: 'Spec-driven development with full audit trails. Our compliance team actually reviewed the architecture and approved it in one meeting.',
    author: 'Priya Narayan',
    role: 'Product Manager',
    company: 'Nexum Analytics',
  },
]

const techLogos = [
  { name: 'Next.js', icon: '▲' },
  { name: 'FastAPI', icon: '⚡' },
  { name: 'PostgreSQL', icon: '🐘' },
  { name: 'TypeScript', icon: 'TS' },
  { name: 'OpenAI SDK', icon: '◎' },
  { name: 'Vercel', icon: '△' },
]

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <main className="min-h-screen bg-surface-950 overflow-hidden">
      <Navbar />

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative min-h-screen bg-surface-950 flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(139,92,246,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_70%_60%,rgba(6,182,212,0.06),transparent)]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 ${mounted ? 'animate-fade-in-down' : 'opacity-0'}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500" />
            </span>
            <span className="text-xs font-medium text-white/50 tracking-wide">
              AI · MCP · Open Source
            </span>
          </div>

          {/* Main headline */}
          <h1 className={`font-display font-extrabold tracking-tight text-white leading-[1.05] mb-6
            text-5xl sm:text-6xl md:text-7xl lg:text-8xl
            ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Task management,<br />
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400 bg-clip-text text-transparent">
              reimagined.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className={`text-lg md:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed mb-10
            ${mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
            Tell the AI what you need. It creates, updates, completes, and organises your tasks —
            all through a secure MCP bridge, never directly touching your database.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row gap-3 justify-center mb-16 ${mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'}`}>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-lg
                bg-primary-600 hover:bg-primary-500 transition-colors duration-200 shadow-lg shadow-primary-900/30"
            >
              Start for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white/60 rounded-lg
                border border-white/10 hover:border-white/20 hover:text-white/80 transition-all duration-200"
            >
              Explore features
            </Link>
          </div>

          {/* Tech logo strip */}
          <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 ${mounted ? 'animate-fade-in-up animation-delay-500' : 'opacity-0'}`}>
            <span className="text-xs text-white/20 tracking-widest uppercase font-medium mr-2">Powered by</span>
            {techLogos.map((t) => (
              <span key={t.name} className="text-xs font-semibold text-white/25 hover:text-white/50 transition-colors duration-200 cursor-default">
                {t.icon !== 'TS' ? <span className="mr-1">{t.icon}</span> : null}
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-white/20 tracking-widest uppercase">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 bg-surface-950 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge label="Features" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight mb-4">
              Everything you need.<br />
              <span className="text-white/30">Nothing you don't.</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              A complete AI-native task management stack — from the database to the chat interface — designed for teams that care about quality.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW ─────────────────────────── */}
      <section className="py-24 md:py-32 bg-surface-900 border-t border-white/[0.04] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text side */}
            <div>
              <SectionBadge label="How it works" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-4">
                Natural language.<br />Real actions.
              </h2>
              <p className="text-white/40 text-sm md:text-base leading-relaxed mb-8">
                Type a message like <span className="text-white/70 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">"Complete the design review task and add a follow-up for tomorrow"</span> and the AI executes both operations through MCP tools in sequence — with zero ambiguity.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Create tasks', desc: '"Add a task: Review the API spec"' },
                  { label: 'Complete tasks', desc: '"Mark the design review as done"' },
                  { label: 'List & filter', desc: '"Show me all pending tasks"' },
                  { label: 'Delete tasks', desc: '"Remove the old onboarding task"' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-none mt-0.5">
                      <svg className="w-3 h-3 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white/70">{item.label}</span>
                      <span className="text-white/25 mx-2">·</span>
                      <span className="text-xs text-white/30 font-mono">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side — mock terminal/chat */}
            <div className="relative">
              <div className="rounded-xl border border-white/[0.06] bg-surface-950 overflow-hidden shadow-2xl">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                  <span className="ml-3 text-xs text-white/20 font-mono">AI Chat — EvoTask Pro</span>
                </div>
                {/* Chat messages */}
                <div className="p-5 space-y-4 min-h-[280px]">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-none">
                      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="bg-white/5 rounded-xl rounded-tl-none px-4 py-2.5 text-sm text-white/60 max-w-[80%]">
                      Add a task to finalise the Q4 roadmap and mark the kickoff meeting as done
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-none">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <div className="bg-primary-900/30 border border-primary-800/30 rounded-xl rounded-tr-none px-4 py-2.5 text-sm text-primary-200 max-w-[80%]">
                      Done! ✓ Created <span className="font-semibold">"Finalise Q4 roadmap"</span> and marked <span className="font-semibold">"Kickoff meeting"</span> as complete. Anything else?
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-none">
                      <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="bg-white/5 rounded-xl rounded-tl-none px-4 py-2.5 text-sm text-white/60 max-w-[80%]">
                      Show me all my pending tasks
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-none">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <div className="bg-primary-900/30 border border-primary-800/30 rounded-xl rounded-tr-none px-4 py-2.5 text-sm text-primary-200 max-w-[80%]">
                      You have <span className="font-semibold">3 pending tasks</span>:<br/>
                      · Finalise Q4 roadmap<br/>
                      · Review API documentation<br/>
                      · Schedule team sync
                    </div>
                  </div>
                </div>
                {/* Input bar */}
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-xs text-white/20 flex-1">Message AI assistant...</span>
                    <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-px bg-primary-500/5 rounded-xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────── */}
      <section className="border-t border-white/[0.04] bg-surface-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} mounted={mounted} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-surface-950 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left label */}
            <div className="lg:sticky lg:top-32">
              <SectionBadge label="Get started" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-4">
                Up and running<br />in three steps.
              </h2>
              <p className="text-white/40 text-sm md:text-base leading-relaxed mb-8">
                No complex onboarding. No configuration wizards. You're productive from the moment you sign in.
              </p>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg
                  bg-primary-600 hover:bg-primary-500 transition-colors duration-200"
              >
                Create free account
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Right steps */}
            <div className="space-y-10 relative">
              {steps.map((s, i) => (
                <StepCard key={s.step} {...s} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────── */}
      <section className="py-24 md:py-32 bg-surface-900 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge label="Testimonials" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
              Trusted by engineering teams.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────── */}
      <section className="py-24 md:py-32 bg-surface-950 border-t border-white/[0.04] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(139,92,246,0.12),transparent)]" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-4">
            Ready to ship faster?
          </h2>
          <p className="text-white/40 text-sm md:text-base leading-relaxed mb-10">
            Join engineers who manage their work through AI. No credit card required, no time limit on the free tier.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-lg
                bg-primary-600 hover:bg-primary-500 transition-colors duration-200 shadow-lg shadow-primary-900/30"
            >
              Get started — it's free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/20">No credit card · Cancel anytime · GDPR compliant</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
