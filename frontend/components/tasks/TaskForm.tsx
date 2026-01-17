'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'

interface TaskFormProps {
  onSubmit: (data: { title: string; description?: string }) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export default function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [titleError, setTitleError] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Clear error when typing
  useEffect(() => {
    if (title && titleError) {
      setTitleError('')
    }
  }, [title, titleError])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation with shake animation
    if (!title.trim()) {
      setTitleError('Title is required')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
      return
    }

    if (title.length > 200) {
      setTitleError('Title must be less than 200 characters')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    if (description && description.length > 1000) {
      setTitleError('Description must be less than 1000 characters')
      return
    }

    setTitleError('')

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
      })

      // Show success animation
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)

      // Clear form on success
      setTitle('')
      setDescription('')
      setIsExpanded(false)
    } catch {
      // Error is handled by parent component
    }
  }

  const titleLength = title.length
  const titleProgress = (titleLength / 200) * 100
  const isNearLimit = titleLength > 160
  const isAtLimit = titleLength >= 200

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title field */}
      <div className="relative">
        <label className="flex items-center justify-between text-sm font-medium text-surface-700 mb-2">
          <span>
            Task title <span className="text-red-500">*</span>
          </span>
          {isNearLimit && (
            <span className={`text-xs tabular-nums transition-colors duration-200 ${
              isAtLimit ? 'text-red-500 font-semibold' : 'text-amber-500'
            }`}>
              {titleLength}/200
            </span>
          )}
        </label>

        <div className={`relative ${shake ? 'animate-shake' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => {
              setIsExpanded(true)
              setIsFocused(true)
            }}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            placeholder="What needs to be done?"
            className={`w-full px-4 py-3.5 bg-white border-2 rounded-xl text-surface-900 placeholder-surface-400
              transition-all duration-300 ease-out
              ${titleError
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                : isFocused
                  ? 'border-primary-500 ring-4 ring-primary-500/10'
                  : 'border-surface-200 hover:border-surface-300'
              }
              focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed`}
            maxLength={200}
          />

          {/* Progress bar for title length */}
          {isNearLimit && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-100 rounded-b-xl overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAtLimit ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(titleProgress, 100)}%` }}
              />
            </div>
          )}

          {/* Success checkmark */}
          {showSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center animate-pop">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path className="check-animation" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Error message with animation */}
        <div className={`overflow-hidden transition-all duration-300 ${
          titleError ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          <p className="text-sm text-red-600 flex items-center gap-1.5 animate-slide-up-fade">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {titleError}
          </p>
        </div>
      </div>

      {/* Expandable description */}
      <div className={`transition-all duration-500 ease-out overflow-hidden ${
        isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <label className="flex items-center justify-between text-sm font-medium text-surface-700 mb-2">
          <span>
            Description <span className="text-surface-400 font-normal">(optional)</span>
          </span>
          <span className={`text-xs tabular-nums transition-colors duration-200 ${
            description.length > 900 ? 'text-amber-500' : 'text-surface-400'
          }`}>
            {description.length}/1000
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          placeholder="Add more details about this task..."
          rows={3}
          className="w-full px-4 py-3 bg-white border-2 border-surface-200 rounded-xl text-surface-900 placeholder-surface-400
            transition-all duration-300 ease-out resize-none
            hover:border-surface-300
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none
            disabled:opacity-60 disabled:cursor-not-allowed"
          maxLength={1000}
        />
      </div>

      {/* Submit button with enhanced styling */}
      <button
        type="submit"
        disabled={isLoading || !title.trim()}
        className="group relative w-full py-3.5 px-6 rounded-xl font-semibold text-white overflow-hidden
          transition-all duration-300 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          active:scale-[0.98]"
      >
        {/* Background gradient */}
        <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500" />

        {/* Hover gradient */}
        <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Shine effect */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Shadow */}
        <span className="absolute inset-0 rounded-xl shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-shadow duration-300" />

        {/* Content */}
        <span className="relative flex items-center justify-center gap-2.5">
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Creating task...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Task</span>
            </>
          )}
        </span>
      </button>

      {/* Helper text */}
      {!isExpanded && (
        <p className="text-xs text-surface-400 text-center animate-fade-in">
          Click the title field to add more details
        </p>
      )}
    </form>
  )
}
