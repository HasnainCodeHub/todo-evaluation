'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth/auth-client'
import { useTasks } from '@/hooks/useTasks'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'
import { TaskListSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// Premium Progress ring component with smooth animations
function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  const getProgressColor = () => {
    if (animatedProgress >= 80) return 'text-success-500'
    if (animatedProgress >= 50) return 'text-primary-500'
    return 'text-amber-500'
  }

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500" />

      <svg className="transform -rotate-90 relative drop-shadow-lg" width={size} height={size}>
        {/* Background track with subtle gradient */}
        <circle
          className="text-surface-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress arc with animated gradient */}
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="url(#progressGradient)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))'
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6">
              <animate attributeName="stop-color" values="#8b5cf6;#06b6d4;#8b5cf6" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#a855f7">
              <animate attributeName="stop-color" values="#a855f7;#8b5cf6;#a855f7" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#06b6d4">
              <animate attributeName="stop-color" values="#06b6d4;#8b5cf6;#06b6d4" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold tabular-nums transition-all duration-500 ${getProgressColor()}`}>
          {animatedProgress}%
        </span>
        <span className="text-xs text-surface-500 font-medium">Complete</span>
      </div>
    </div>
  )
}

// Premium Stat card component with micro-interactions
function StatCard({
  icon,
  label,
  value,
  color = 'primary',
  index = 0,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color?: 'primary' | 'success' | 'warning' | 'accent'
  index?: number
}) {
  const [mounted, setMounted] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), index * 100)
    return () => clearTimeout(mountTimer)
  }, [index])

  useEffect(() => {
    if (!mounted) return

    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setAnimatedValue(Math.floor(value * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, mounted])

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600 shadow-primary-500/25',
    success: 'from-success-500 to-emerald-600 shadow-success-500/25',
    warning: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    accent: 'from-accent-500 to-cyan-600 shadow-accent-500/25',
  }

  const glowColors = {
    primary: 'group-hover:shadow-primary-500/20',
    success: 'group-hover:shadow-success-500/20',
    warning: 'group-hover:shadow-amber-500/20',
    accent: 'group-hover:shadow-accent-500/20',
  }

  return (
    <div
      className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-surface-100/80 shadow-card
        hover:shadow-xl ${glowColors[color]} hover:-translate-y-1
        transition-all duration-500 ease-out cursor-default overflow-hidden
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorClasses[color].replace('shadow-', 'from-').replace('/25', ' to-transparent')} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]}
          flex items-center justify-center shadow-lg
          transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="text-2xl font-bold text-surface-900 tabular-nums">{animatedValue}</p>
        </div>
      </div>
    </div>
  )
}

type FilterType = 'all' | 'pending' | 'completed'

function DashboardContent() {
  const { data: session, isPending } = useSession()
  const tasks = useTasks()

  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setMounted(true)

    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Load tasks once authenticated
  useEffect(() => {
    if (session?.user) {
      tasks.refresh()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isPending) {
    return null
  }

  const user = session?.user

  const totalTasks = tasks.tasks.length
  const completedTasks = tasks.tasks.filter(t => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  const filteredTasks = tasks.tasks.filter(task => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const filterButtons: { key: FilterType; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: 'all',
      label: 'All Tasks',
      count: totalTasks,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
    },
    {
      key: 'pending',
      label: 'Pending',
      count: pendingTasks,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      key: 'completed',
      label: 'Completed',
      count: completedTasks,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
  ]

  return (
    <main className="min-h-screen bg-surface-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-surface-100/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 md:h-20 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <span className="font-display font-bold text-xl text-surface-900 hidden sm:block group-hover:text-primary-600 transition-colors">
                Evolution of Todo
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-surface-50 to-surface-100/80 rounded-full border border-surface-200/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-surface-900 leading-tight">{user?.name || 'User'}</span>
                  <span className="text-xs text-surface-500 leading-tight">{user?.email}</span>
                </div>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-600
                  bg-white/80 backdrop-blur-sm border border-surface-200/80 rounded-xl
                  hover:text-red-600 hover:bg-red-50 hover:border-red-200
                  transition-all duration-300 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className={`mb-8 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-surface-500 text-sm font-medium mb-1">{greeting}</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-surface-900">
                Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>
              </h1>
              <p className="text-surface-500 mt-2">Here's what's happening with your tasks today.</p>
            </div>

            {/* Quick date display */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-surface-100/80 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="text-xs text-surface-500">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            label="Total Tasks"
            value={totalTasks}
            color="primary"
            index={0}
          />
          <StatCard
            icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Pending"
            value={pendingTasks}
            color="warning"
            index={1}
          />
          <StatCard
            icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Completed"
            value={completedTasks}
            color="success"
            index={2}
          />
          <div className={`group bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-surface-100/80 shadow-card
            hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out
            flex items-center justify-center overflow-hidden relative
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '300ms' }}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <ProgressRing progress={completionRate} size={100} strokeWidth={8} />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Task Form Card */}
          <div className="lg:col-span-1">
            <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-surface-100/80 shadow-card sticky top-24 overflow-hidden relative
              ${mounted ? 'animate-fade-in-left' : 'opacity-0'}`}>
              {/* Top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-[length:200%_100%] animate-gradient-x" />

              <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Create New Task
              </h2>
              <TaskForm
                onSubmit={tasks.createTask}
                isLoading={tasks.isLoading}
                error={tasks.error}
              />
            </div>
          </div>

          {/* Tasks List */}
          <div className={`lg:col-span-2 ${mounted ? 'animate-fade-in-right' : 'opacity-0'}`}>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {filterButtons.map(({ key, label, count, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    filter === key
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white/90 backdrop-blur-sm text-surface-600 border border-surface-200/80 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  <span className={`transition-transform duration-300 ${filter === key ? '' : 'group-hover:scale-110'}`}>
                    {icon}
                  </span>
                  {label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    filter === key
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-100 text-surface-500 group-hover:bg-primary-100 group-hover:text-primary-700'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Task List */}
            {tasks.isLoading && !tasks.tasks.length ? (
              <TaskListSkeleton count={3} />
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                title={filter === 'all' ? "No tasks yet" : filter === 'pending' ? "All caught up!" : "No completed tasks"}
                description={
                  filter === 'all'
                    ? "Create your first task to get started on your productivity journey."
                    : filter === 'pending'
                    ? "You've completed all your tasks. Great work!"
                    : "Complete some tasks to see them here."
                }
              />
            ) : (
              <TaskList
                tasks={filteredTasks}
                onToggleComplete={tasks.toggleComplete}
                onUpdate={tasks.updateTask}
                onDelete={tasks.deleteTask}
                isLoading={tasks.isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const hasRedirected = React.useRef(false)

  useEffect(() => {
    if (!isPending && !session?.user && !hasRedirected.current) {
      hasRedirected.current = true
      window.location.href = "/signin"
    }
  }, [isPending, session])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mx-auto" />
            <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-xl animate-pulse" />
          </div>
          <p className="text-surface-600 font-medium">Verifying your session...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return <DashboardContent />
}
