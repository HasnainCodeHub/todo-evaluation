'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth/auth-client'
import { useTasks } from '@/hooks/useTasks'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'
import { TaskListSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChatPanel } from '@/components/chat'

/* ─────────────────────────────────────────────
   Progress ring
───────────────────────────────────────────── */
function ProgressRing({ progress, size = 100, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const [animated, setAnimated] = useState(0)
  const r = (size - strokeWidth) / 2
  const circ = r * 2 * Math.PI
  const offset = circ - (animated / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setAnimated(progress), 100)
    return () => clearTimeout(t)
  }, [progress])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" className="text-white/10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" stroke="url(#pg)" fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{animated}%</span>
        <span className="text-[10px] text-white/40 font-medium">Done</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Stat card
───────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, index }: {
  icon: React.ReactNode; label: string; value: number | React.ReactNode; accent: string; index: number
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), index * 80); return () => clearTimeout(t) }, [index])

  return (
    <div className={`bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 transition-all duration-500
      hover:bg-white/[0.06] hover:border-white/10
      ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {icon !== null && (
        <div className="flex items-center justify-between mb-3">
          <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>{icon}</div>
        </div>
      )}
      <p className="text-xs font-medium text-white/40 mb-0.5">{label}</p>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function ProgressCard({ progress, index }: { progress: number; index: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), index * 80); return () => clearTimeout(t) }, [index])

  return (
    <div className={`bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 transition-all duration-500
      hover:bg-white/[0.06] hover:border-white/10 flex flex-col items-center justify-center gap-2
      ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <ProgressRing progress={progress} size={64} strokeWidth={6} />
      <p className="text-xs font-medium text-white/40">Progress</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Mobile tab bar
───────────────────────────────────────────── */
type MobileTab = 'tasks' | 'add' | 'chat'

function MobileTabBar({ active, onChange, pendingCount }: {
  active: MobileTab; onChange: (t: MobileTab) => void; pendingCount: number
}) {
  const tabs: { key: MobileTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'tasks',
      label: 'Tasks',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    {
      key: 'add',
      label: 'Add Task',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
    },
    {
      key: 'chat',
      label: 'AI Chat',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface-950/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb">
      <div className="flex">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors duration-200
              ${active === key ? 'text-primary-400' : 'text-white/30 hover:text-white/60'}`}
          >
            <div className="relative">
              {icon}
              {key === 'tasks' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <span>{label}</span>
            {active === key && <div className="w-4 h-0.5 rounded-full bg-primary-500" />}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Filter type
───────────────────────────────────────────── */
type FilterType = 'all' | 'pending' | 'completed'

/* ─────────────────────────────────────────────
   Dashboard content
───────────────────────────────────────────── */
function DashboardContent() {
  const { data: session } = useSession()
  const tasks = useTasks()

  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [greeting, setGreeting] = useState('')
  const [mobileTab, setMobileTab] = useState<MobileTab>('tasks')

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    if (session?.user) tasks.refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const user = session?.user
  const totalTasks = tasks.tasks.length
  const completedTasks = tasks.tasks.filter(t => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  const filteredTasks = tasks.tasks.filter(task => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const filterButtons: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalTasks },
    { key: 'pending', label: 'Pending', count: pendingTasks },
    { key: 'completed', label: 'Done', count: completedTasks },
  ]

  return (
    <main className="min-h-screen bg-surface-950 pb-20 lg:pb-0">
      {/* ── Header ── */}
      <header className="bg-surface-950/95 backdrop-blur-lg border-b border-white/[0.06] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 md:h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-none group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-display font-bold text-white hidden sm:block">EvoTask</span>
            </Link>

            {/* User + logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs flex-none">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight truncate max-w-[140px]">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-white/40 leading-tight truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/40
                  rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20
                  transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">

        {/* Welcome row */}
        <div className={`flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-6 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div>
            <p className="text-xs text-white/30 font-medium mb-0.5">{greeting}</p>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white">
              {user?.name ? `${user.name.split(' ')[0]}'s workspace` : 'Your workspace'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30 flex-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            label="Total" value={totalTasks} accent="bg-indigo-500/10" index={0}
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Pending" value={pendingTasks} accent="bg-amber-500/10" index={1}
          />
          <StatCard
            icon={<svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Completed" value={completedTasks} accent="bg-emerald-500/10" index={2}
          />
          <ProgressCard progress={completionRate} index={3} />
        </div>

        {/* ── Desktop 3-column layout ── */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Add Task */}
          <div className="col-span-1">
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] sticky top-24 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-primary-500 to-primary-700" />
              <div className="p-5">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New task
                </h2>
                <TaskForm onSubmit={tasks.createTask} isLoading={tasks.isLoading} error={tasks.error} />
              </div>
            </div>
          </div>

          {/* Task list */}
          <div className="col-span-1">
            <div className="flex gap-1.5 mb-4">
              {filterButtons.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                    ${filter === key
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:border-white/10 hover:text-white/70'
                    }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                    ${filter === key ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/40'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
            {tasks.isLoading && !tasks.tasks.length ? (
              <TaskListSkeleton count={3} />
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                icon={<svg className="w-16 h-16 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                title={filter === 'pending' ? 'All caught up!' : filter === 'completed' ? 'Nothing completed yet' : 'No tasks yet'}
                description={filter === 'pending' ? 'No pending tasks — great work!' : filter === 'completed' ? 'Complete a task to see it here.' : 'Add your first task to get started.'}
              />
            ) : (
              <TaskList tasks={filteredTasks} onToggleComplete={tasks.toggleComplete} onUpdate={tasks.updateTask} onDelete={tasks.deleteTask} isLoading={tasks.isLoading} />
            )}
          </div>

          {/* AI Chat */}
          <div className="col-span-1">
            <div className="sticky top-24 h-[calc(100vh-7rem)] max-h-[700px]">
              <ChatPanel onTasksChanged={tasks.refresh} />
            </div>
          </div>
        </div>

        {/* ── Mobile tab panels ── */}
        <div className="lg:hidden">
          {mobileTab === 'tasks' && (
            <div>
              <div className="flex gap-1.5 mb-4">
                {filterButtons.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200
                      ${filter === key
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/70'
                      }`}
                  >
                    {label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                      ${filter === key ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/40'}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
              {tasks.isLoading && !tasks.tasks.length ? (
                <TaskListSkeleton count={4} />
              ) : filteredTasks.length === 0 ? (
                <EmptyState
                  icon={<svg className="w-16 h-16 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                  title={filter === 'pending' ? 'All caught up!' : filter === 'completed' ? 'Nothing completed yet' : 'No tasks yet'}
                  description={filter === 'pending' ? 'No pending tasks — nice work!' : filter === 'completed' ? 'Complete a task to see it here.' : 'Tap "Add Task" to create your first task.'}
                />
              ) : (
                <TaskList tasks={filteredTasks} onToggleComplete={tasks.toggleComplete} onUpdate={tasks.updateTask} onDelete={tasks.deleteTask} isLoading={tasks.isLoading} />
              )}
            </div>
          )}

          {mobileTab === 'add' && (
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-primary-500 to-primary-700" />
              <div className="p-5">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create new task
                </h2>
                <TaskForm
                  onSubmit={async (data) => {
                    await tasks.createTask(data)
                    setMobileTab('tasks')
                  }}
                  isLoading={tasks.isLoading}
                  error={tasks.error}
                />
              </div>
            </div>
          )}

          {mobileTab === 'chat' && (
            <div className="h-[calc(100dvh-12rem)]" style={{ minHeight: 400 }}>
              <ChatPanel onTasksChanged={() => { tasks.refresh(); setMobileTab('tasks') }} />
            </div>
          )}
        </div>
      </div>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} pendingCount={pendingTasks} />
    </main>
  )
}

/* ─────────────────────────────────────────────
   Page wrapper with auth guard
───────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const hasRedirected = React.useRef(false)

  useEffect(() => {
    if (!isPending && !session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      window.location.href = '/signin'
    }
  }, [isPending, session])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/40">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return <DashboardContent />
}
