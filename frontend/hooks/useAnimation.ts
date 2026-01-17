'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook for handling mount/unmount animations
 * Returns isVisible for animation state and shouldRender for DOM presence
 */
export function useAnimatedMount(show: boolean, duration: number = 300) {
  const [shouldRender, setShouldRender] = useState(show)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      // Small delay to ensure DOM is ready
      const showTimeout = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(showTimeout)
    } else {
      setIsVisible(false)
      const hideTimeout = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(hideTimeout)
    }
  }, [show, duration])

  return { shouldRender, isVisible }
}

/**
 * Hook for intersection observer based animations
 * Triggers when element enters viewport
 */
export function useInView(options: IntersectionObserverInit = {}) {
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true)
          setHasAnimated(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasAnimated, options])

  return { ref, isInView }
}

/**
 * Hook for staggered list animations
 * Returns delay values for each item in a list
 */
export function useStaggeredAnimation(itemCount: number, baseDelay: number = 50) {
  const getDelay = useCallback(
    (index: number) => `${index * baseDelay}ms`,
    [baseDelay]
  )

  const getDelayStyle = useCallback(
    (index: number) => ({ animationDelay: `${index * baseDelay}ms` }),
    [baseDelay]
  )

  return { getDelay, getDelayStyle }
}

/**
 * Hook for animated counter (number that counts up)
 */
export function useAnimatedCounter(
  end: number,
  duration: number = 2000,
  start: number = 0
) {
  const [count, setCount] = useState(start)
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef<number>()

  const animate = useCallback(() => {
    setIsAnimating(true)
    const startTime = performance.now()

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(start + (end - start) * easeOut))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setIsAnimating(false)
      }
    }

    frameRef.current = requestAnimationFrame(step)
  }, [end, duration, start])

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return { count, animate, isAnimating }
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

/**
 * Hook for button press animation state
 */
export function useButtonPress() {
  const [isPressed, setIsPressed] = useState(false)

  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
  }

  return { isPressed, handlers }
}

/**
 * Hook for tracking scroll progress
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollTop = window.scrollY
      setProgress(scrollHeight > 0 ? scrollTop / scrollHeight : 0)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

/**
 * Hook for parallax scrolling effect
 */
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const relativeScroll = scrolled - elementTop + window.innerHeight
      setOffset(relativeScroll * speed)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return { ref, offset }
}
