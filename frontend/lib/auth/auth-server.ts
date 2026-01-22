// Better Auth Server Configuration
// Phase II – Hackathon Compliant
// Frontend-only authentication authority

import { betterAuth } from "better-auth"
import { Pool } from "pg"

/* ------------------------------------------------------------------ */
/* ENV VALIDATION                                                      */
/* ------------------------------------------------------------------ */

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Better Auth")
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required for Better Auth")
}

/* ------------------------------------------------------------------ */
/* CONSTANTS (DO NOT COMPUTE THESE DYNAMICALLY)                        */
/* ------------------------------------------------------------------ */

// 🔒 Single canonical frontend URL (production)
const PROD_FRONTEND_URL = "https://ai-based-todo.vercel.app"

// Local dev URL
const DEV_FRONTEND_URL = "http://localhost:3000"

/* ------------------------------------------------------------------ */
/* DATABASE                                                            */
/* ------------------------------------------------------------------ */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

pool.on("error", (err) => {
  console.error("[Better Auth] Database pool error:", err)
})

/* ------------------------------------------------------------------ */
/* BETTER AUTH CONFIGURATION                                           */
/* ------------------------------------------------------------------ */

export const auth = betterAuth({
  // Shared secret (also used by FastAPI for JWT verification)
  secret: process.env.BETTER_AUTH_SECRET,

  // Better Auth manages its own tables
  database: pool,

  // Auth methods
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // 🔐 CRITICAL: fixed base URL for cookies & CSRF
  baseURL:
    process.env.NODE_ENV === "production"
      ? PROD_FRONTEND_URL
      : DEV_FRONTEND_URL,

  // 🔐 CRITICAL: only frontend origins
  trustedOrigins: [
    PROD_FRONTEND_URL,
    DEV_FRONTEND_URL,
  ],

  // Cookie security
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Avoid edge-session weirdness
  session: {
    cookieCache: {
      enabled: false,
    },
  },
})
