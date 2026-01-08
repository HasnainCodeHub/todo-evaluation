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

/**
 * Determine the base URL for Better Auth.
 * CRITICAL: In Vercel production, BETTER_AUTH_URL should be set manually.
 * Fallback to VERCEL_URL if provided, else localhost.
 */
const getBaseURL = (): string => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }
  return 'http://localhost:3000'
}

/**
 * Determine trusted origins.
 * Includes both the primary production URL and any Vercel preview URLs.
 */
const getTrustedOrigins = (): string[] => {
  const origins = new Set<string>()

  // Core production URLs
  origins.add('https://todo-evaluation.vercel.app')

  // Dynamic origin from env vars
  const baseURL = getBaseURL()
  if (baseURL) {
    origins.add(baseURL)
  }

  // Developer localhost
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000')
  }

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
  // Ensure absolute URL in production for cookie scoping
  baseURL: getBaseURL(),
  trustedOrigins: getTrustedOrigins(),
  // Production-only settings
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
})
