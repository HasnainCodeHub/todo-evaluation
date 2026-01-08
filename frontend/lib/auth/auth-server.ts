// lib/auth/auth-server.ts
// Phase 2.4 – FINAL Better Auth Server Configuration (Production Safe)

import { betterAuth } from "better-auth"
import { Pool } from "pg"

/* ------------------------------------------------------------------ */
/* Environment Guards */
/* ------------------------------------------------------------------ */

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required")
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required")
}

/* ------------------------------------------------------------------ */
/* Base URL Resolution */
/* ------------------------------------------------------------------ */
/**
 * RULES:
 * - Production (Vercel): use VERCEL_URL ONLY
 * - Development: localhost
 * - NEVER hardcode domains
 * - NEVER mix BETTER_AUTH_URL + VERCEL_URL
 */
function getBaseURL(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000"
  }

  throw new Error("Unable to resolve Better Auth base URL")
}

/* ------------------------------------------------------------------ */
/* Trusted Origins */
/* ------------------------------------------------------------------ */
/**
 * Trusted origins MUST match the origin that sets cookies.
 * Anything extra will break sessions.
 */
function getTrustedOrigins(): string[] {
  const origins = [getBaseURL()]

  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000")
  }

  return origins
}

/* ------------------------------------------------------------------ */
/* Better Auth Instance */
/* ------------------------------------------------------------------ */

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,

  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
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
      maxAge: 5 * 60, // 5 minutes
    },
  },
})

/* ------------------------------------------------------------------ */
/* Notes */
/* ------------------------------------------------------------------ */
/**
 * - Cookies are scoped to ONE origin only
 * - /api/auth/jwt MUST be called from same frontend origin
 * - FastAPI validates JWT, NOT Better Auth session cookies
 * - This config fixes:
 *   - Redirect loop
 *   - 401 after login
 *   - CORS preflight failures
 *   - Cookie mismatch on Vercel
 */
