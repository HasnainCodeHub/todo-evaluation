'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '../../components/auth/AuthProvider'
import { useTasks } from '../../hooks/useTasks'
import TaskForm from '../../components/tasks/TaskForm'
import TaskList from '../../components/tasks/TaskList'
import { TaskListSkeleton, StatCardSkeleton } from '../../components/ui/Skeleton'

// Progress ring component
function ProgressRing({ progress, size = 80, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-surface-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary-500 transition-all duration-700 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="url(#progressGradient)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-surface-900">{progress}%</span>
      </div>
    </div>
  )
}

// Filter type
type FilterType = 'all' | 'pending' | 'completed'

export default function DashboardPage() {
  const router = useRouter()
  const auth = useAuthContext()
  const tasks = useTasks()
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showWelcome, setShowWelcome] = useState(true)
  const hasRedirected = useRef(false)

  useEffect(() => {
    setMounted(true)
    // Hide welcome message after a delay
    const timer = setTimeout(() => setShowWelcome(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Redirect to signin if not authenticated (only after auth state resolves)
  // Use ref to prevent multiple redirect attempts
  useEffect(() => {
    if (!auth.authState.isLoading && !auth.authState.isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/signin')
    }
  }, [auth.authState.isLoading, auth.authState.isAuthenticated, router])

  // Load tasks on mount
  useEffect(() => {
    if (auth.authState.isAuthenticated) {
      tasks.refresh()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authState.isAuthenticated])

  const handleSignOut = () => {
    auth.signOut()
    router.push('/')
  }

  // Show loading state while auth is resolving
  if (auth.authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-white to-surface-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting state for unauthenticated users
  if (!auth.authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-white to-surface-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // Calculate task stats
  const totalTasks = tasks.tasks.length
  const completedTasks = tasks.tasks.filter(t => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filter tasks
  const filteredTasks = tasks.tasks.filter(task => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-surface-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-surface-900">Evolution of Todo</span>
                <span className="hidden lg:inline-block ml-2 px-2 py-0.5 bg-success-100 text-success-700 text-xs font-semibold rounded-full">
                  Dashboard
                </span>
              </div>
            </Link>

            {/* User menu */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* User info */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {auth.authState.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-surface-900 leading-tight">{auth.authState.user?.name || 'User'}</p>
                  <p className="text-xs text-surface-500">{auth.authState.user?.email}</p>
                </div>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className={`mb-8 lg:mb-12 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-surface-900 mb-2">
                {getGreeting()}, <span className="gradient-text">{auth.authState.user?.name?.split(' ')[0] || 'User'}</span>
              </h1>
              <p className="text-surface-600 text-lg">
                {totalTasks === 0
                  ? "Ready to be productive? Create your first task!"
                  : pendingTasks === 0
                    ? "All caught up! You've completed all your tasks."
                    : `You have ${pendingTasks} task${pendingTasks === 1 ? '' : 's'} waiting for you.`
                }
              </p>
            </div>

            {/* Quick stats badge */}
            {totalTasks > 0 && (
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-100 shadow-card">
                <ProgressRing progress={completionRate} size={64} strokeWidth={6} />
                <div className="text-left">
                  <p className="text-sm text-surface-500">Today&apos;s Progress</p>
                  <p className="text-lg font-semibold text-surface-900">
                    {completedTasks} of {totalTasks} done
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12 ${mounted ? 'animate-fade-in-up animation-delay-100' : 'opacity-0'}`}>
          {tasks.isLoading && tasks.tasks.length === 0 ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Total Tasks */}
              <div className="group relative p-5 lg:p-6 bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-400" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-surface-900">{totalTasks}</p>
                    <p className="text-sm text-surface-500">Total Tasks</p>
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div className="group relative p-5 lg:p-6 bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success-500 to-success-400" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-surface-900">{completedTasks}</p>
                    <p className="text-sm text-surface-500">Completed</p>
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="group relative p-5 lg:p-6 bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-500 to-accent-400" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-surface-900">{pendingTasks}</p>
                    <p className="text-sm text-surface-500">Pending</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="group relative p-5 lg:p-6 bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-surface-900">{completionRate}%</p>
                    <p className="text-sm text-surface-500">Complete</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Task Form */}
          <div className={`lg:col-span-1 ${mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6 lg:p-8 sticky top-28">
              {/* Form header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-surface-900">Add New Task</h2>
                  <p className="text-sm text-surface-500">What needs to be done?</p>
                </div>
              </div>
              <TaskForm onSubmit={tasks.createTask} isLoading={tasks.isLoading} error={tasks.error} />
            </div>
          </div>

          {/* Task List */}
          <div className={`lg:col-span-2 ${mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'}`}>
            <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
              {/* List Header */}
              <div className="px-6 py-5 border-b border-surface-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-surface-900">Your Tasks</h2>
                      <p className="text-sm text-surface-500">
                        {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
                        {filter !== 'all' && ` (${filter})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Filter buttons */}
                    <div className="flex items-center bg-surface-100 rounded-xl p-1">
                      {(['all', 'pending', 'completed'] as FilterType[]).map((filterOption) => (
                        <button
                          key={filterOption}
                          onClick={() => setFilter(filterOption)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${
                            filter === filterOption
                              ? 'bg-white text-surface-900 shadow-sm'
                              : 'text-surface-500 hover:text-surface-700'
                          }`}
                        >
                          {filterOption}
                        </button>
                      ))}
                    </div>

                    {/* Refresh button */}
                    <button
                      onClick={() => tasks.refresh()}
                      className="p-2.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-xl transition-all duration-200"
                      title="Refresh tasks"
                    >
                      <svg className={`w-5 h-5 ${tasks.isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {tasks.error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-700">Something went wrong</p>
                    <p className="text-sm text-red-600">{tasks.error}</p>
                  </div>
                </div>
              )}

              {/* Task List Content */}
              <div className="p-6">
                {tasks.isLoading && tasks.tasks.length === 0 ? (
                  <TaskListSkeleton count={3} />
                ) : filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
                      {filter === 'completed' ? (
                        <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : filter === 'pending' ? (
                        <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-surface-900 mb-2">
                      {filter === 'completed'
                        ? 'No completed tasks yet'
                        : filter === 'pending'
                          ? 'All caught up!'
                          : 'No tasks yet'
                      }
                    </h3>
                    <p className="text-surface-500 max-w-sm">
                      {filter === 'completed'
                        ? 'Complete some tasks to see them here.'
                        : filter === 'pending'
                          ? "You've completed all your tasks. Great job!"
                          : 'Create your first task using the form on the left to get started.'
                      }
                    </p>
                    {filter !== 'all' && (
                      <button
                        onClick={() => setFilter('all')}
                        className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View all tasks
                      </button>
                    )}
                  </div>
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
        </div>
      </div>
    </main>
  )
}
