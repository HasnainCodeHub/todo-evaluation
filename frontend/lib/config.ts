// Environment configuration for Phase 2.4 Frontend
// Uses getters to ensure environment variables are read at call time

// API URL getter - ensures the value is read when needed, not at module load
export function getApiUrl(): string {
  // Enforce production URL for production builds
  if (process.env.NODE_ENV === 'production') {
    return 'https://evaluation-todo.vercel.app/';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
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
      return process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    },
    get secret(): string {
      return process.env.BETTER_AUTH_SECRET || ''
    },
  },
} as const

export default config
