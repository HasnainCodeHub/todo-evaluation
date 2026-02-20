'use client'

import type { Task } from '../../types/task'
import { useState, useEffect } from 'react'
import ConfirmDialog from '../ui/ConfirmDialog'
import EditTaskForm from './EditTaskForm'

interface TaskItemProps {
  task: Task
  onToggleComplete: (taskId: number) => void
  onUpdate: (taskId: number, updates: { title?: string; description?: string }) => void
  onDelete: (taskId: number) => void
  isLoading?: boolean
  index?: number
}

export default function TaskItem({ task, onToggleComplete, onUpdate, onDelete, isLoading, index = 0 }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 50)
    return () => clearTimeout(timer)
  }, [index])

  const handleToggle = async () => {
    if (!isLoading && !isToggling) {
      setIsToggling(true)
      if (!task.completed) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 1000)
      }
      onToggleComplete(task.id)
      setTimeout(() => setIsToggling(false), 500)
    }
  }

  const handleDeleteClick = () => setShowDeleteConfirm(true)

  const handleDeleteConfirm = () => {
    setIsDeleting(true)
    setShowDeleteConfirm(false)
    setTimeout(() => onDelete(task.id), 300)
  }

  const handleDeleteCancel = () => setShowDeleteConfirm(false)

  const handleEdit = (updates: { title?: string; description?: string }) => {
    if (!isLoading) {
      onUpdate(task.id, updates)
      setIsEditing(false)
    }
  }

  return (
    <>
      <div
        className={`group relative p-5 rounded-2xl border transition-all duration-500 ease-out transform-gpu ${
          task.completed
            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
            : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05]'
        } ${isDeleting ? 'opacity-0 scale-95 -translate-x-4' : mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        } ${isToggling ? 'scale-[0.98]' : ''}`}
        style={{ transitionDelay: mounted ? '0ms' : `${index * 50}ms` }}
      >
        {/* Hover glow */}
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${
          task.completed
            ? 'bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 opacity-100'
            : 'bg-gradient-to-r from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100'
        }`} />

        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: '50%', top: '50%',
                  backgroundColor: ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'][i % 5],
                  transform: `rotate(${i * 30}deg) translateY(-20px)`,
                  animationDelay: `${i * 30}ms`
                }}
              />
            ))}
          </div>
        )}

        <div className="relative flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={isLoading || isEditing || isDeleting}
            className={`relative mt-0.5 flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all duration-300 ease-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 disabled:opacity-50
              flex items-center justify-center group/check active:scale-90 ${
              task.completed
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-400 border-emerald-500 focus-visible:ring-emerald-500 shadow-md shadow-emerald-500/25'
                : 'border-white/20 hover:border-primary-500 hover:bg-primary-500/10 focus-visible:ring-primary-500'
            }`}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <span className={`absolute inset-0 rounded-full ${isToggling ? 'animate-ping bg-current opacity-20' : ''}`} />
            <svg
              className={`w-4 h-4 text-white transition-all duration-300 ${task.completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path className={task.completed ? 'check-animation' : ''} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            {!task.completed && (
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/check:opacity-100 transition-opacity duration-200">
                <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-base break-words transition-all duration-500 leading-relaxed ${
              task.completed
                ? 'text-emerald-400/70 line-through decoration-emerald-500/40 decoration-2'
                : 'text-white group-hover:text-white/90'
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-sm mt-1.5 break-words transition-all duration-300 leading-relaxed ${
                task.completed ? 'text-emerald-400/40' : 'text-white/40 group-hover:text-white/50'
              }`}>
                {task.description}
              </p>
            )}

            {/* Actions */}
            <div className={`flex items-center gap-2 mt-4 transition-all duration-300 ${
              task.completed ? 'opacity-40' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            }`}>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading || isDeleting || isEditing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white/50
                  bg-white/5 hover:bg-white/10 rounded-lg
                  transition-all duration-200 disabled:opacity-50 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isLoading || isDeleting || isEditing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-400
                  bg-red-500/10 hover:bg-red-500/20 rounded-lg
                  transition-all duration-200 disabled:opacity-50 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Done badge */}
          <div className={`flex-shrink-0 transition-all duration-500 ${task.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Done
            </span>
          </div>
        </div>

        {/* Toggle progress bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden transition-opacity duration-300 ${isToggling ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-full w-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 animate-shimmer bg-[length:200%_100%]" />
        </div>
      </div>

      {isEditing && (
        <EditTaskForm task={task} onUpdate={handleEdit} onCancel={() => setIsEditing(false)} />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message={`Are you sure you want to delete "${task.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  )
}
