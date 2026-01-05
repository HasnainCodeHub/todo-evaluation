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
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: ['http://localhost:3000'],
})

// Note: JWT tokens for API authentication are generated via /api/auth/jwt endpoint
// using jsonwebtoken library to match backend HS256 verification
