// Environment configuration for Phase 2.4 Frontend
// Uses getters to ensure environment variables are read at call time

// Production backend URL - hardcoded to ensure no localhost leakage
const PRODUCTION_API_URL = 'https://evaluation-todo.vercel.app'

// API URL getter - ensures the value is read when needed, not at module load
export function getApiUrl(): string {
  // Production: always use hardcoded production URL
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_API_URL
  }
  // Development: use env var or fail explicitly
  const devUrl = process.env.NEXT_PUBLIC_API_URL
  if (!devUrl) {
    console.warn('[Config] NEXT_PUBLIC_API_URL not set, using localhost:8000')
    return 'http://localhost:8000'
  }
  return devUrl
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
  // This config is kept for reference/debugging only
  auth: {
    get url(): string {
      // Server-side only - uses VERCEL_URL automatically
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
      }
      if (process.env.BETTER_AUTH_URL) {
        return process.env.BETTER_AUTH_URL
      }
      if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000'
      }
      // Production must have VERCEL_URL
      throw new Error('No auth URL configured for production')
    },
    get secret(): string {
      const secret = process.env.BETTER_AUTH_SECRET
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('BETTER_AUTH_SECRET is required in production')
      }
      return secret || ''
    },
  },
} as const

export default config
