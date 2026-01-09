# Vercel Deployment Guide - Bridge Pattern Authentication

## Architecture Overview

```
[Browser]
    ↓ (Better Auth Cookie)
[Frontend: https://todo-evaluation.vercel.app]
    ↓ (Next.js API Route: /api/auth/jwt)
    ↓ (JWT Token Generation)
    ↓ (Authorization: Bearer <JWT>)
[Backend: https://evaluation-todo.vercel.app]
    ↓ (JWT Validation)
[Neon PostgreSQL Database]
```

## Deployment URLs

- **Frontend**: https://todo-evaluation.vercel.app/
- **Backend**: https://evaluation-todo.vercel.app/

## Prerequisites

✅ Backend already deployed at https://evaluation-todo.vercel.app/
✅ Neon PostgreSQL database configured
✅ Backend has `JWT_SECRET` environment variable set

## Frontend Deployment Steps

### Step 1: Push Code to Repository

Ensure all changes are committed and pushed to your Git repository:

```bash
git add .
git commit -m "feat: Add JWT bridge pattern authentication"
git push origin main
```

### Step 2: Create Vercel Project (if not exists)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your repository
4. Select `frontend` as the root directory
5. Framework Preset: **Next.js** (auto-detected)

### Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

#### Required Environment Variables

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `BETTER_AUTH_SECRET` | `b218af51b238aaece19c4ab3d8af8d32` | Production, Preview, Development |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://evaluation-todo.vercel.app` | Production |

#### Optional Environment Variables

| Variable Name | Value | Note |
|---------------|-------|------|
| `BETTER_AUTH_URL` | `https://todo-evaluation.vercel.app` | Auto-detected from VERCEL_URL if not set |

**CRITICAL SECURITY NOTES:**
- ✅ `BETTER_AUTH_SECRET` **MUST** match the `JWT_SECRET` in your backend
- ✅ Use the **SAME** `DATABASE_URL` as your backend (Better Auth needs to access sessions)
- ✅ Never commit secrets to Git - always use Vercel environment variables

### Step 4: Configure Build Settings

In Vercel project settings:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 5: Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for build to complete (3-5 minutes)
3. Vercel will provide deployment URL

### Step 6: Update Production URL (if needed)

If Vercel assigns a different URL, update:

1. **Backend CORS** (`backend/app/main.py`):
   ```python
   allow_origins=[
       # ...
       "https://your-actual-frontend-url.vercel.app",
   ]
   ```

2. **Better Auth Trusted Origins** (`frontend/lib/auth/auth-server.ts`):
   ```typescript
   origins.add('https://your-actual-frontend-url.vercel.app')
   ```

## Backend Verification

Ensure your backend (https://evaluation-todo.vercel.app/) has these environment variables:

| Variable Name | Value |
|---------------|-------|
| `JWT_SECRET` | `b218af51b238aaece19c4ab3d8af8d32` |
| `JWT_ALGORITHM` | `HS256` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_...` |

**CRITICAL**: `JWT_SECRET` (backend) MUST match `BETTER_AUTH_SECRET` (frontend)

## Post-Deployment Verification

### 1. Test Backend API

```bash
# Should return 401 Unauthorized
curl https://evaluation-todo.vercel.app/api/tasks/

# Should return pong
curl https://evaluation-todo.vercel.app/api/ping
```

### 2. Test Frontend

1. Visit https://todo-evaluation.vercel.app/
2. Click "Sign Up"
3. Create a new account
4. Verify you're redirected to dashboard
5. Create a task
6. Verify task appears in list

### 3. Test JWT Bridge (Browser DevTools)

1. Open DevTools → Network tab
2. Create a task
3. Look for requests:
   - `POST /api/auth/jwt` → Should return `{ "token": "..." }` (200)
   - `POST https://evaluation-todo.vercel.app/api/tasks/` → Should have `Authorization: Bearer ...` header (200)

### 4. Verify Authentication Flow

1. Sign out
2. Try to access `/dashboard` directly
3. Should redirect to `/signin`
4. Sign in again
5. Should redirect to `/dashboard` with tasks loaded

## Troubleshooting

### Issue: "Session expired or unauthorized"

**Cause**: JWT secret mismatch between frontend and backend

**Fix**:
1. Verify `BETTER_AUTH_SECRET` (frontend) matches `JWT_SECRET` (backend)
2. Redeploy both services after updating

### Issue: CORS Error

**Cause**: Backend doesn't allow frontend origin

**Fix**:
1. Check backend `main.py` CORS configuration
2. Ensure frontend URL is in `allow_origins` list
3. Redeploy backend

### Issue: "[AuthGuard] BetterAuth error: {}"

**Cause**: Better Auth session issue

**Fix**:
1. Check `DATABASE_URL` is set correctly in frontend
2. Verify frontend can connect to Neon database
3. Clear browser cookies and try again
4. Check Vercel logs for Better Auth errors

### Issue: "Failed to obtain authentication token"

**Cause**: JWT bridge route failing

**Fix**:
1. Check `/api/auth/jwt` route logs in Vercel
2. Verify `BETTER_AUTH_SECRET` is set
3. Verify user has active Better Auth session
4. Check browser Network tab for 500 errors

## Environment Variable Reference

### Frontend (todo-evaluation.vercel.app)

```env
# Required
BETTER_AUTH_SECRET=b218af51b238aaece19c4ab3d8af8d32
DATABASE_URL=postgresql://neondb_owner:npg_...
NEXT_PUBLIC_API_URL=https://evaluation-todo.vercel.app

# Auto-provided by Vercel
VERCEL=1
VERCEL_URL=todo-evaluation.vercel.app
```

### Backend (evaluation-todo.vercel.app)

```env
# Required
JWT_SECRET=b218af51b238aaece19c4ab3d8af8d32
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://neondb_owner:npg_...

# Auto-provided by Vercel
VERCEL=1
VERCEL_URL=evaluation-todo.vercel.app
```

## Security Checklist

- ✅ Secrets stored in Vercel environment variables (not in code)
- ✅ `JWT_SECRET` matches `BETTER_AUTH_SECRET`
- ✅ CORS configured with specific origins (not `*`)
- ✅ HTTPS enforced in production
- ✅ Cookies use `secure` flag in production
- ✅ JWT tokens expire (15 minutes)
- ✅ Database connection uses SSL

## Local Development

For local development, use `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=b218af51b238aaece19c4ab3d8af8d32
DATABASE_URL=postgresql://neondb_owner:npg_...
```

Backend `.env`:

```env
JWT_SECRET=b218af51b238aaece19c4ab3d8af8d32
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://neondb_owner:npg_...
```

## Deployment Architecture

### Request Flow

1. **User visits frontend** → Better Auth checks session cookie
2. **User creates task** → Frontend calls API client
3. **API client** → Calls `/api/auth/jwt` (Next.js API route)
4. **JWT Bridge** → Validates Better Auth session → Returns JWT
5. **API client** → Calls backend with `Authorization: Bearer <JWT>`
6. **Backend** → Validates JWT → Returns user-scoped data

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Better Auth | Frontend | Session management (cookies) |
| JWT Bridge | `/api/auth/jwt` | Convert session to JWT |
| API Client | `lib/api/client.ts` | Fetch JWT + call backend |
| Backend Auth | `dependencies/auth.py` | Validate JWT |
| CORS | `backend/main.py` | Allow frontend origin |

## Success Criteria

✅ Users can sign up and sign in
✅ Dashboard loads tasks for authenticated users
✅ Tasks are user-scoped (users only see their own tasks)
✅ JWT bridge generates valid tokens
✅ Backend validates JWT correctly
✅ Session persists across page refreshes
✅ Sign out clears session and redirects
✅ Protected routes redirect unauthenticated users

## Support

If issues persist:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Check Network tab for failed requests
4. Verify environment variables are set correctly
5. Test locally first before deploying

---

**Last Updated**: 2026-01-09
**Architecture**: Bridge Pattern (Better Auth → JWT → FastAPI)
