'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  variant?: 'transparent' | 'solid'
  showAuthButtons?: boolean
}

export function Navbar({ variant = 'transparent', showAuthButtons = true }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()

  // Handle scroll with direction detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 20)

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down')
      } else {
        setScrollDirection('up')
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const navLinks = [
    { href: '/#features', label: 'Features', icon: '✨' },
    { href: '/#how-it-works', label: 'How It Works', icon: '🚀' },
    { href: '/#technology', label: 'Technology', icon: '⚡' },
  ]

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/'
    return pathname === href
  }

  const navBackground = variant === 'solid' || isScrolled
    ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-surface-100/50'
    : 'bg-transparent'

  const navTransform = scrollDirection === 'down' && isScrolled && !isMobileMenuOpen
    ? '-translate-y-full'
    : 'translate-y-0'

  const toggleMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${navBackground} ${navTransform}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo with enhanced animation */}
            <Link href="/" className="flex items-center gap-3 group relative">
              <div className="relative">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-glow-lg transition-all duration-500 group-hover:scale-105 group-active:scale-95">
                  <svg className="w-5 h-5 text-white transition-transform duration-300 group-hover:rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-xl text-surface-900 transition-colors duration-300 group-hover:text-primary-600">
                  Evolution of Todo
                </span>
                <span className="hidden lg:inline-flex ml-2 px-2.5 py-1 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-xs font-semibold rounded-full items-center gap-1 animate-pulse-slow">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                  AI-Native
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with enhanced hover effects */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden ${
                    isActive(link.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-surface-600 hover:text-primary-600'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover background effect */}
                  <span className={`absolute inset-0 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl transition-transform duration-300 ${
                    isActive(link.href) ? 'scale-100' : 'scale-0 group-hover:scale-100'
                  }`} />
                  <span className="relative flex items-center gap-2">
                    {link.label}
                  </span>
                  {/* Active indicator */}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Auth Buttons with enhanced styling */}
            {showAuthButtons && (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/signin"
                  className="relative px-4 py-2.5 text-sm font-medium text-surface-600 hover:text-primary-600 transition-all duration-300 rounded-xl hover:bg-surface-50 active:scale-95"
                >
                  Sign In
                </Link>
                <Link
                  href="/signin?mode=signup"
                  className="group relative px-6 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden active:scale-95 transition-transform duration-150"
                >
                  {/* Gradient background */}
                  <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-300" />
                  {/* Hover gradient overlay */}
                  <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Shine effect */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  {/* Shadow */}
                  <span className="absolute inset-0 shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-shadow duration-300 rounded-xl" />
                  <span className="relative flex items-center gap-2">
                    Get Started
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button with enhanced animation */}
            <button
              onClick={toggleMenu}
              className="md:hidden relative p-2.5 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition-all duration-300 active:scale-90 touch-target"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="relative w-6 h-6">
                {/* Hamburger to X animation */}
                <span
                  className={`absolute left-0 w-6 h-0.5 bg-current rounded-full transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? 'top-3 rotate-45' : 'top-1.5 rotate-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-3 w-6 h-0.5 bg-current rounded-full transition-all duration-200 ${
                    isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`}
                />
                <span
                  className={`absolute left-0 w-6 h-0.5 bg-current rounded-full transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? 'top-3 -rotate-45' : 'top-[18px] rotate-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu with enhanced animations */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-surface-100 shadow-lg transition-all duration-400 ease-out ${
            isMobileMenuOpen
              ? 'opacity-100 translate-y-0 visible'
              : 'opacity-0 -translate-y-4 invisible'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-300 touch-target ${
                  isActive(link.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-surface-700 hover:text-primary-600 hover:bg-surface-50 active:bg-surface-100'
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  opacity: isMobileMenuOpen ? 1 : 0,
                  transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-10px)',
                  transition: `all 0.3s ease-out ${index * 50}ms`
                }}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
                <svg className="w-4 h-4 ml-auto text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {showAuthButtons && (
              <>
                <div className="my-3 border-t border-surface-100" />
                <Link
                  href="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3.5 text-base font-medium text-surface-700 hover:text-primary-600 hover:bg-surface-50 rounded-xl transition-all duration-300 touch-target"
                  style={{
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `all 0.3s ease-out ${navLinks.length * 50 + 50}ms`
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signin?mode=signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/25 transition-all duration-300 active:scale-[0.98] touch-target"
                  style={{
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(10px)',
                    transition: `all 0.3s ease-out ${navLinks.length * 50 + 100}ms`
                  }}
                >
                  Get Started Free
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      <div
        className={`fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </>
  )
}
