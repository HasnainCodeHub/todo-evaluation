// Environment configuration for Phase 2.4 Frontend
// Uses getters to ensure environment variables are read at call time

// Production backend API URL
// IMPORTANT: This must match the deployed backend URL
const PRODUCTION_API_URL = 'https://evaluation-todo.vercel.app'

// API URL getter - ensures the value is read when needed, not at module load
export function getApiUrl(): string {
  // First priority: explicit environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // In browser, detect production environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Production - use production backend URL
      return PRODUCTION_API_URL
    }
  }

  // Server-side production check
  if (process.env.VERCEL) {
    return PRODUCTION_API_URL
  }

  // Default to localhost for development
  return 'http://localhost:8000'
}

// Auth URL getter
export function getAuthUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }

  // On client-side in production, use current origin
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin
    }
  }

  // Server-side: check for Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

export const config = {
  api: {
    // Use getter to ensure env var is read at runtime
    get url(): string {
      return getApiUrl()
    },
  },
  auth: {
    get url(): string {
      return getAuthUrl()
    },
    get secret(): string {
      return process.env.BETTER_AUTH_SECRET || ''
    },
  },
  // Helper to check if we're in production
  get isProduction(): boolean {
    if (typeof window !== 'undefined') {
      return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    }
    return !!process.env.VERCEL
  },
} as const

export default config
