'use client'

import React, { useEffect, useState, useRef, forwardRef, ReactNode } from 'react'
import { useInView, useReducedMotion, useStaggeredAnimation } from '@/hooks/useAnimation'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  once?: boolean
}

/**
 * Fade in animation wrapper with optional direction
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  direction = 'up',
  className = '',
  once = true,
}: FadeInProps) {
  const { ref, isInView } = useInView()
  const reducedMotion = useReducedMotion()

  const directionClasses = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: '',
  }

  const baseStyles: React.CSSProperties = {
    transitionDelay: `${delay}ms`,
    transitionDuration: `${duration}ms`,
  }

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all ease-out ${
        isInView
          ? 'opacity-100 translate-x-0 translate-y-0'
          : `opacity-0 ${directionClasses[direction]}`
      } ${className}`}
      style={baseStyles}
    >
      {children}
    </div>
  )
}

interface StaggerChildrenProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
  itemClassName?: string
  animation?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight'
}

/**
 * Staggered children animation - animates each child with a delay
 */
export function StaggerChildren({
  children,
  staggerDelay = 100,
  className = '',
  itemClassName = '',
  animation = 'fadeUp',
}: StaggerChildrenProps) {
  const { ref, isInView } = useInView()
  const reducedMotion = useReducedMotion()

  const animationClasses = {
    fadeUp: {
      hidden: 'opacity-0 translate-y-4',
      visible: 'opacity-100 translate-y-0',
    },
    fadeIn: {
      hidden: 'opacity-0',
      visible: 'opacity-100',
    },
    scaleIn: {
      hidden: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
    slideLeft: {
      hidden: 'opacity-0 translate-x-4',
      visible: 'opacity-100 translate-x-0',
    },
    slideRight: {
      hidden: 'opacity-0 -translate-x-4',
      visible: 'opacity-100 translate-x-0',
    },
  }

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={`transition-all duration-500 ease-out ${
            isInView
              ? animationClasses[animation].visible
              : animationClasses[animation].hidden
          } ${itemClassName}`}
          style={{ transitionDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

interface ScaleOnHoverProps {
  children: ReactNode
  scale?: number
  className?: string
}

/**
 * Scale animation on hover
 */
export function ScaleOnHover({
  children,
  scale = 1.02,
  className = '',
}: ScaleOnHoverProps) {
  return (
    <div
      className={`transition-transform duration-300 ease-out hover:scale-[${scale}] ${className}`}
      style={{ ['--hover-scale' as string]: scale }}
    >
      {children}
    </div>
  )
}

interface AnimatedListProps {
  items: ReactNode[]
  className?: string
  itemClassName?: string
  staggerDelay?: number
  animation?: 'slide' | 'fade' | 'scale'
}

/**
 * Animated list with staggered entrance
 */
export function AnimatedList({
  items,
  className = '',
  itemClassName = '',
  staggerDelay = 50,
  animation = 'slide',
}: AnimatedListProps) {
  const [mounted, setMounted] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  const animationClasses = {
    slide: {
      base: 'transition-all duration-300 ease-out',
      hidden: 'opacity-0 -translate-x-3',
      visible: 'opacity-100 translate-x-0',
    },
    fade: {
      base: 'transition-opacity duration-300 ease-out',
      hidden: 'opacity-0',
      visible: 'opacity-100',
    },
    scale: {
      base: 'transition-all duration-300 ease-out',
      hidden: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
  }

  const anim = animationClasses[animation]

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${anim.base} ${mounted && !reducedMotion ? anim.visible : anim.hidden} ${itemClassName}`}
          style={
            reducedMotion
              ? {}
              : { transitionDelay: `${index * staggerDelay}ms` }
          }
        >
          {item}
        </div>
      ))}
    </div>
  )
}

interface PulseProps {
  children: ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
  className?: string
}

/**
 * Pulsing animation wrapper
 */
export function Pulse({ children, intensity = 'subtle', className = '' }: PulseProps) {
  const intensityClasses = {
    subtle: 'animate-pulse-slow',
    medium: 'animate-pulse',
    strong: 'animate-glow-pulse',
  }

  return (
    <div className={`${intensityClasses[intensity]} ${className}`}>{children}</div>
  )
}

interface ShimmerProps {
  width?: string
  height?: string
  rounded?: string
  className?: string
}

/**
 * Shimmer loading placeholder
 */
export function Shimmer({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  className = '',
}: ShimmerProps) {
  return (
    <div
      className={`bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200
        bg-[length:200%_100%] animate-skeleton-wave ${width} ${height} ${rounded} ${className}`}
    />
  )
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

/**
 * Button with ripple effect on click
 */
export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, className = '', onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()

      setRipples((prev) => [...prev, { x, y, id }])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)

      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
            }}
          />
        ))}
      </button>
    )
  }
)
RippleButton.displayName = 'RippleButton'

interface CountUpProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
  startOnView?: boolean
}

/**
 * Animated counter that counts up to a number
 */
export function CountUp({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  className = '',
  startOnView = true,
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const { ref, isInView } = useInView()
  const hasAnimated = useRef(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setCount(end)
      return
    }

    if (!startOnView || (isInView && !hasAnimated.current)) {
      hasAnimated.current = true
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(end * easeOut))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [end, duration, isInView, startOnView, reducedMotion])

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

interface FloatingProps {
  children: ReactNode
  amplitude?: number
  duration?: number
  className?: string
}

/**
 * Floating animation wrapper
 */
export function Floating({
  children,
  amplitude = 10,
  duration = 3,
  className = '',
}: FloatingProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={`animate-float ${className}`}
      style={{
        ['--float-amplitude' as string]: `${amplitude}px`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  className?: string
  barClassName?: string
  animated?: boolean
  showLabel?: boolean
}

/**
 * Animated progress bar
 */
export function ProgressBar({
  progress,
  className = '',
  barClassName = '',
  animated = true,
  showLabel = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`relative h-2 bg-surface-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full
          ${animated ? 'transition-all duration-700 ease-out' : ''} ${barClassName}`}
        style={{ width: `${clampedProgress}%` }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-surface-700">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  )
}
