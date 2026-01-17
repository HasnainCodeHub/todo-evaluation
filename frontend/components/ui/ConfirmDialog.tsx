'use client'

import { useEffect, useState, useRef } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  title?: string
}

export default function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  title = 'Confirm Action'
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Handle visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
      // Focus the cancel button for accessibility
      setTimeout(() => confirmButtonRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onCancel()
    }, 200)
  }

  const handleConfirm = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onConfirm()
    }, 200)
  }

  if (!isOpen && !isVisible) return null

  const variantStyles = {
    danger: {
      icon: (
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-gradient-to-br from-red-100 to-red-50',
      iconGlow: 'shadow-lg shadow-red-500/20',
      button: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30'
    },
    warning: {
      icon: (
        <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconGlow: 'shadow-lg shadow-amber-500/20',
      button: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30'
    },
    primary: {
      icon: (
        <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-gradient-to-br from-primary-100 to-primary-50',
      iconGlow: 'shadow-lg shadow-primary-500/20',
      button: 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl
            transition-all duration-300 ease-out ${
            isClosing
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 pt-8">
            {/* Icon with glow */}
            <div className={`mx-auto w-14 h-14 rounded-full ${styles.iconBg} ${styles.iconGlow}
              flex items-center justify-center mb-5 animate-spring-bounce`}>
              {styles.icon}
            </div>

            {/* Title */}
            <h3
              id="dialog-title"
              className="text-xl font-display font-bold text-surface-900 text-center mb-3"
            >
              {title}
            </h3>

            {/* Message */}
            <p className="text-surface-600 text-center leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-5 py-3 border-2 border-surface-200 rounded-xl font-semibold text-surface-700
                hover:bg-surface-50 hover:border-surface-300 active:scale-[0.98]
                transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-surface-400"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              className={`flex-1 px-5 py-3 rounded-xl font-semibold active:scale-[0.98]
                transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
