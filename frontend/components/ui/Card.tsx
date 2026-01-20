'use client'

import { ReactNode } from 'react'

interface CardProps {
  variant?: 'default' | 'gradient' | 'glass' | 'outlined' | 'elevated'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

export function Card({
  variant = 'glass',
  hover = true,
  padding = 'md',
  children,
  className = '',
}: CardProps) {
  const baseStyles = `
    rounded-2xl overflow-hidden
    transition-all duration-300 ease-out
  `

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const variantStyles = {
    default: 'bg-white border border-surface-100/60 shadow-lg',
    gradient: 'bg-gradient-to-br from-white to-surface-50 border border-surface-100/60 shadow-lg',
    glass: 'bg-white/95 backdrop-blur-xl border border-surface-100/60 shadow-lg',
    outlined: 'bg-transparent border-2 border-surface-200',
    elevated: 'bg-white/95 backdrop-blur-xl border border-surface-100/50 shadow-xl',
  }

  const hoverStyles = hover
    ? 'hover:shadow-2xl hover:-translate-y-1 hover:border-blue-200/70 cursor-pointer'
    : ''

  return (
    <div className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, icon, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-xl font-semibold text-surface-900">{title}</h3>
          {subtitle && <p className="text-sm text-surface-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
