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
// In production, use BETTER_AUTH_URL or VERCEL_URL
// In development, use localhost
const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

// Determine trusted origins
// In production, trust the deployment URL
// In development, trust localhost
const getTrustedOrigins = () => {
  const origins = ['http://localhost:3000']

  if (process.env.BETTER_AUTH_URL) {
    origins.push(process.env.BETTER_AUTH_URL)
  }
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }

  return origins
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
