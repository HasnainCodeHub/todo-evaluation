'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth/auth-client'
import { useTasks } from '@/hooks/useTasks'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'
import { TaskListSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-surface-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="font-bold">Evolution of Todo</Link>

          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Welcome, {user?.name || 'User'}
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <TaskForm
            onSubmit={tasks.createTask}
            isLoading={tasks.isLoading}
            error={tasks.error}
          />

          <div className="lg:col-span-2">
            {tasks.isLoading && !tasks.tasks.length ? (
              <TaskListSkeleton count={3} />
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
