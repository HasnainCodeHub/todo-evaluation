'use client'

import type { Task } from '../../types/task'
import TaskItem from './TaskItem'
import { useState, useEffect } from 'react'

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (taskId: number) => Promise<void> | void
  onUpdate: (taskId: number, updates: { title?: string; description?: string; priority?: Task['priority']; due_date?: string | null; category?: string | null }) => Promise<void> | void
  onDelete: (taskId: number) => Promise<void> | void
  isLoading?: boolean
}

export default function TaskList({ tasks, onToggleComplete, onUpdate, onDelete, isLoading }: TaskListProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sort tasks: incomplete first, then by ID descending (newest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return b.id - a.id
  })

  const incompleteTasks = sortedTasks.filter(t => !t.completed)
  const completedTasks = sortedTasks.filter(t => t.completed)

  return (
    <div className="space-y-6">
      {/* Incomplete tasks */}
      {incompleteTasks.length > 0 && (
        <div className="space-y-3">
          {incompleteTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isLoading={isLoading}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Completed tasks section */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          {incompleteTasks.length > 0 && (
            <div className={`flex items-center gap-3 pt-4 transition-all duration-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${incompleteTasks.length * 50 + 100}ms` }}
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-200 to-transparent" />
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold text-success-600 bg-success-50 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Completed ({completedTasks.length})
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-200 to-transparent" />
            </div>
          )}
          {completedTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isLoading={isLoading}
              index={incompleteTasks.length + index + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
