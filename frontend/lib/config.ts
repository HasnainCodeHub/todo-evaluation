// Environment configuration for Phase 2.4 Frontend
// Uses getters to ensure environment variables are read at call time

// Production backend API URL
// IMPORTANT: This must match the deployed backend URL
// Backend: https://todo-backend-xi-eosin.vercel.app
const PRODUCTION_API_URL = 'https://todo-backend-xi-eosin.vercel.app'

// API URL getter - ensures the value is read when needed, not at module load
export function getApiUrl(): string {
  // First priority: explicit environment variable (useful for overrides/testing)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Production check: Hardcoded production URL for any non-localhost environment
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return PRODUCTION_API_URL
  }

  // In browser, detect production environment by hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return PRODUCTION_API_URL
    }
  }

  // Default to localhost for development
  return 'http://localhost:8000'
}

// Auth URL getter - mainly used for server-side Better Auth initialization
export function getAuthUrl(): string {
  // Explicit BETTER_AUTH_URL is top priority
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }

  // Vercel auto-injected URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // On client-side in production, use current origin
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin
    }
  }

  // Only use localhost in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // Fallback but warn - production must have a URL
  console.warn('[Config] No auth URL configured for production, using origin/localhost fallback')
  return 'http://localhost:3000'
}

export const config = {
  api: {
    // Use getter to ensure env var is read at runtime
    get url(): string {
      return getApiUrl()
    },
  },
  // Note: auth.url is NOT used by auth-client.ts anymore
  // Better Auth client now uses relative URLs (same-origin)
  // This config is kept for reference/debugging/server-side initialization
  auth: {
    get url(): string {
      return getAuthUrl()
    },
    get secret(): string {
      const secret = process.env.BETTER_AUTH_SECRET
      if (!secret && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
        throw new Error('BETTER_AUTH_SECRET is required in production')
      }
      return secret || ''
    },
  },
  // Helper to check if we're in production
  get isProduction(): boolean {
    if (typeof window !== 'undefined') {
      return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    }
    return !!process.env.VERCEL || process.env.NODE_ENV === 'production'
  },
} as const

export default config
