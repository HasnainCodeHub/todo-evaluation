'use client'

import { FormEvent, useState, useEffect } from 'react'
import type { Task, TaskPriority } from '../../types/task'

interface EditTaskFormProps {
  task: Task
  onUpdate: (updates: { title?: string; description?: string; priority?: TaskPriority; due_date?: string | null; category?: string | null }) => Promise<void> | void
  onCancel: () => void
}

export default function EditTaskForm({ task, onUpdate, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 16) : '')
  const [category, setCategory] = useState(task.category || '')
  const [titleError, setTitleError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')

  useEffect(() => {
    const firstInput = document.getElementById('edit-title')
    if (firstInput) firstInput.focus()
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setTitleError('Title is required'); return }
    if (title.length > 200) { setTitleError('Title must be less than 200 characters'); return }
    if (description.length > 1000) { setDescriptionError('Description must be less than 1000 characters'); return }
    if (category.length > 50) { setDescriptionError('Category must be less than 50 characters'); return }
    setTitleError(''); setDescriptionError('')
    try {
      await onUpdate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category: category.trim() || null,
      })
    } catch {
      // Error handled by parent
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface-900 border border-white/[0.06] shadow-2xl transition-all animate-scale-in">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Task
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-white/60 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input id="edit-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="input-modern" maxLength={200} required />
                {titleError && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {titleError}
                  </p>
                )}
                <p className="mt-1 text-xs text-white/25 text-right">{title.length}/200</p>
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-white/60 mb-2">
                  Description <span className="text-white/30">(optional)</span>
                </label>
                <textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..." rows={4} className="input-modern resize-none" maxLength={1000} />
                {descriptionError && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {descriptionError}
                  </p>
                )}
                <p className="mt-1 text-xs text-white/25 text-right">{description.length}/1000</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-white/60 mb-2">Priority</label>
                  <select id="edit-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="input-modern">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-due-date" className="block text-sm font-medium text-white/60 mb-2">
                    Due Date <span className="text-white/30">(optional)</span>
                  </label>
                  <input id="edit-due-date" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-modern" />
                </div>
              </div>

              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-white/60 mb-2">
                  Category <span className="text-white/30">(optional)</span>
                </label>
                <input
                  id="edit-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-modern"
                  maxLength={50}
                  placeholder="Work, Personal, Follow-up..."
                />
                <p className="mt-1 text-xs text-white/25 text-right">{category.length}/50</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 border border-white/10 rounded-xl font-medium text-white/50 hover:bg-white/5 hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="btn-gradient">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
