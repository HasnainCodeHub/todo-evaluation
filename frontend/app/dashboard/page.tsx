'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth/auth-client'
import { useTasks } from '@/hooks/useTasks'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'
import { TaskListSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// Animated Progress ring component with smooth transitions
function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

      <svg className="transform -rotate-90 relative" width={size} height={size}>
        {/* Background track */}
        <circle
          className="text-surface-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress arc */}
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
            filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.4))'
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-surface-900 tabular-nums transition-all duration-500">
          {animatedProgress}%
        </span>
        <span className="text-xs text-surface-500 font-medium">Complete</span>
      </div>
    </div>
  )
}

// Animated Stat card component with micro-interactions
function StatCard({
  icon,
  label,
  value,
  color = 'primary',
  index = 0
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

    // Animate the counter
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
    success: 'from-success-500 to-success-600 shadow-success-500/25',
    warning: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    accent: 'from-accent-500 to-accent-600 shadow-accent-500/25',
  }

  const glowColors = {
    primary: 'group-hover:shadow-primary-500/20',
    success: 'group-hover:shadow-success-500/20',
    warning: 'group-hover:shadow-amber-500/20',
    accent: 'group-hover:shadow-accent-500/20',
  }

  return (
    <div
      className={`group bg-white rounded-2xl p-5 border border-surface-100 shadow-card
        hover:shadow-xl ${glowColors[color]} hover:-translate-y-1
        transition-all duration-500 ease-out cursor-default
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]}
          flex items-center justify-center shadow-lg
          transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {/* Icon glow */}
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

  useEffect(() => {
    setMounted(true)
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

  const filterButtons: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All Tasks', count: totalTasks },
    { key: 'pending', label: 'Pending', count: pendingTasks },
    { key: 'completed', label: 'Completed', count: completedTasks },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-surface-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 md:h-20 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl text-surface-900 hidden sm:block">Evolution of Todo</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-50 rounded-full">
                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
                <span className="text-sm text-surface-600">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-surface-900 mb-2">
            Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>
          </h1>
          <p className="text-surface-500">Here's what's happening with your tasks today.</p>
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
          <div className={`group bg-white rounded-2xl p-5 border border-surface-100 shadow-card
            hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out
            flex items-center justify-center
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <ProgressRing progress={completionRate} size={100} strokeWidth={8} />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Task Form Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-card sticky top-24">
              <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {filterButtons.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    filter === key
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-white text-surface-600 border border-surface-200 hover:border-primary-200 hover:bg-primary-50'
                  }`}
                >
                  {label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    filter === key
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-100 text-surface-500'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying your session...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return <DashboardContent />
}
