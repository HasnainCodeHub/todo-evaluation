// Better Auth Server Configuration
// This configures Better Auth for handling user authentication
// Phase 2.4: Authentication Integration

import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required')
}

// Determine the base URL for Better Auth
// PRODUCTION: Must use VERCEL_URL (auto-set by Vercel) or explicit BETTER_AUTH_URL
// DEVELOPMENT: Falls back to localhost only in development mode
const getBaseURL = (): string => {
  // First priority: explicit Better Auth URL (for custom domains)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  }

  // Second priority: VERCEL_URL (auto-set by Vercel in production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Development only: allow localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // Production without VERCEL_URL should not happen, but fail explicitly
  throw new Error(
    'CRITICAL: No base URL configured for Better Auth in production. ' +
    'Set BETTER_AUTH_URL or ensure VERCEL_URL is available.'
  )
}

// Determine trusted origins

// In production, trust the deployment URL
// In development, trust localhost
const getTrustedOrigins = () => {
  const origins = new Set<string>([
    'http://localhost:3000',
    'https://todo-evaluation.vercel.app',
  ])

// Production: Trust the deployment URLs only
// Development: Also trust localhost
const getTrustedOrigins = (): string[] => {
  const origins = new Set<string>()

  // Always trust the known production URL
  origins.add('https://todo-evaluation.vercel.app')

  // Trust explicit BETTER_AUTH_URL origins
  if (process.env.BETTER_AUTH_URL) {
    process.env.BETTER_AUTH_URL
      .split(',')
      .map(url => url.trim().replace(/\/$/, ''))
      .forEach(url => origins.add(url))
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`)
  }


  // Development only: trust localhost
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000')

  return Array.from(origins)
}


export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  // Pass Pool instance directly - Better Auth handles Kysely internally
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  baseURL: getBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
})

// Note: JWT tokens for API authentication are generated via /api/auth/jwt endpoint
// using jsonwebtoken library to match backend HS256 verification
