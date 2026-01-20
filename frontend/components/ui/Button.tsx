'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    disabled = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    ...props
  }, ref) => {

    const baseStyles = `
      relative inline-flex items-center justify-center font-semibold
      rounded-xl transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98] shadow-sm
    `

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3.5 text-base gap-2.5',
    }

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-blue-600 to-indigo-600 text-white
        shadow-lg shadow-blue-500/25
        hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]
        focus:ring-blue-500 focus:ring-offset-white
        before:absolute before:inset-0 before:rounded-xl
        before:bg-gradient-to-r before:from-blue-500 before:to-indigo-600
        before:opacity-0 before:transition-opacity before:duration-300
        hover:before:opacity-100
      `,
      secondary: `
        bg-white/90 backdrop-blur-sm text-surface-700 border border-surface-200/70
        hover:bg-white hover:border-blue-200 hover:text-blue-700 hover:shadow-md
        focus:ring-blue-500 focus:ring-offset-white
      `,
      ghost: `
        bg-transparent text-surface-600 hover:bg-surface-50 hover:text-surface-900
        focus:ring-surface-500 focus:ring-offset-white
      `,
      danger: `
        bg-gradient-to-r from-red-600 to-red-500 text-white
        shadow-lg shadow-red-500/25
        hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02]
        focus:ring-red-500 focus:ring-offset-white
      `,
      success: `
        bg-gradient-to-r from-emerald-600 to-emerald-500 text-white
        shadow-lg shadow-emerald-500/25
        hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]
        focus:ring-emerald-500 focus:ring-offset-white
      `,
      dark: `
        bg-surface-900 text-white
        hover:bg-surface-800 hover:shadow-lg
        focus:ring-surface-500 focus:ring-offset-white
      `,
      light: `
        bg-white text-surface-700 border border-surface-200
        hover:bg-surface-50 hover:shadow-md
        focus:ring-surface-500 focus:ring-offset-white
      `,
    }

    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <LoadingSpinner />
          ) : leftIcon ? (
            <span className="flex-shrink-0">{leftIcon}</span>
          ) : null}
          {children}
          {!isLoading && rightIcon && (
            <span className="flex-shrink-0">{rightIcon}</span>
          )}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
