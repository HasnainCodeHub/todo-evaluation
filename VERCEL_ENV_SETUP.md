# Vercel Environment Variables Setup

## CRITICAL: Production Authentication Fix

This document specifies the EXACT environment variables required for production deployment on Vercel.

## Root Cause of "Redirecting to dashboard..." Loop

1. **Missing VERCEL_URL trust**: Better Auth wasn't configured to trust the production domain
2. **Hardcoded localhost origins**: `trustedOrigins` was only localhost
3. **Cookie scope issues**: Better Auth cookies weren't being set with correct domain

## Required Environment Variables

### Frontend (Vercel Project Settings)

**MANDATORY:**
```bash
# Better Auth Secret (MUST match backend JWT_SECRET exactly)
BETTER_AUTH_SECRET=b218af51b238aaece19c4ab3d8af8d32

# Database URL for Better Auth session storage
DATABASE_URL=postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Backend API URL (update with your backend Vercel URL)
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

**OPTIONAL (but recommended):**
```bash
# Explicit Better Auth URL (if not set, uses VERCEL_URL automatically)
BETTER_AUTH_URL=https://your-frontend.vercel.app
```

### Backend (Vercel Project Settings)

**MANDATORY:**
```bash
# JWT Secret (MUST match frontend BETTER_AUTH_SECRET exactly)
JWT_SECRET=b218af51b238aaece19c4ab3d8af8d32

# JWT Algorithm
JWT_ALGORITHM=HS256

# Database URL
DATABASE_URL=postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Verification Steps

### After Setting Environment Variables:

1. **Redeploy both frontend and backend** (environment changes require redeployment)
2. **Test authentication flow:**
   - Sign in on production URL
   - Verify dashboard loads (not stuck on "Redirecting...")
   - Refresh page - should stay logged in
   - Check browser console for `[Auth]` logs in dev mode
   - Check Network tab - `/api/auth/jwt` should return 200

### Debug Checklist:

- [ ] `BETTER_AUTH_SECRET` set on frontend Vercel
- [ ] `JWT_SECRET` set on backend Vercel
- [ ] Secrets match exactly (no typos, whitespace)
- [ ] `DATABASE_URL` set on frontend Vercel
- [ ] `DATABASE_URL` set on backend Vercel
- [ ] `NEXT_PUBLIC_API_URL` points to backend URL
- [ ] Both projects redeployed after env var changes

## How the Fix Works

### Before (BROKEN):
```typescript
baseURL: 'http://localhost:3000'  // ❌ Hardcoded localhost
trustedOrigins: ['http://localhost:3000']  // ❌ Only trusts localhost
```

### After (FIXED):
```typescript
baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
trustedOrigins: [
  'http://localhost:3000',
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`
]
```

## Vercel Automatic Environment Variables

Vercel automatically provides:
- `VERCEL_URL` - Your deployment URL (without https://)
- `VERCEL_ENV` - Environment (production, preview, development)

Our code now uses these to automatically configure Better Auth for production.

## Cookie Configuration

Better Auth now uses proper session configuration:
```typescript
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutes cache
  },
}
```

This ensures cookies work correctly across the production domain.

## Troubleshooting

### Still stuck on "Redirecting to dashboard..."?

1. Open browser DevTools → Console
2. Look for `[Auth]` logs
3. Check what cookies exist: `document.cookie` in console
4. Verify `/api/auth/jwt` returns 200 in Network tab

### Session not persisting after refresh?

- Check that `better-auth.session_token` cookie exists
- Verify cookie domain matches your Vercel URL
- Ensure `DATABASE_URL` is set correctly

### Backend API calls failing?

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend has `JWT_SECRET` set
- Verify JWT tokens are being sent in Authorization header
