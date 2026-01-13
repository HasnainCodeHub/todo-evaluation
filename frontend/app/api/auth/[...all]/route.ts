// Better Auth API Route Handler
// This catch-all route handles all Better Auth endpoints
// Phase 2.4: Authentication Integration

// Force Node.js runtime for production (pg driver incompatible with Edge)
export const runtime = "nodejs";

import { auth } from '@/lib/auth/auth-server'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
