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

// Determine base URL for Better Auth
// Priority: explicit env var > Vercel URL > localhost
function getServerBaseURL(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

const baseURL = getServerBaseURL()

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
  baseURL,
  trustedOrigins: [
    'http://localhost:3000',
    'https://todo-evolution-liart.vercel.app',
    // Include the current base URL if it's not already listed
    ...(baseURL !== 'http://localhost:3000' && !baseURL.includes('todo-evolution-liart.vercel.app') ? [baseURL] : []),
  ],
})

// Note: JWT tokens for API authentication are generated via /api/auth/jwt endpoint
// using jsonwebtoken library to match backend HS256 verification
