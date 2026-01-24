# Deployment Instructions for Todo Application (Monorepo)

This project follows a monorepo structure with separate frontend and backend applications that need to be deployed independently.

## Architecture Overview

```
[Browser]
    ↓ (Better Auth Cookie)
[Frontend: https://ai-based-todo.vercel.app]
    ↓ (Next.js API Route: /api/auth/jwt)
    ↓ (JWT Token Generation)
    ↓ (Authorization: Bearer <JWT>)
[Backend: https://evaluation-todo.vercel.app]
    ↓ (JWT Validation)
[Neon PostgreSQL Database]
```

## Deployment Process

### 1. Backend Deployment (First)

Deploy the backend first since the frontend depends on it:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a new Vercel project or link to existing one:
   ```bash
   vercel --confirm
   ```

3. Set the following environment variables in Vercel dashboard:
   - `JWT_SECRET`: `b218af51b238aaece19c4ab3d8af8d32`
   - `JWT_ALGORITHM`: `HS256`
   - `DATABASE_URL`: Your Neon PostgreSQL connection string

4. The backend will be deployed to: `https://evaluation-todo.vercel.app/`

### 2. Frontend Deployment (Second)

Deploy the frontend after the backend is ready:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create a new Vercel project or link to existing one:
   ```bash
   vercel --confirm
   ```

3. Set the following environment variables in Vercel dashboard:
   - `BETTER_AUTH_SECRET`: `b218af51b238aaece19c4ab3d8af8d32`
   - `DATABASE_URL`: Same as backend (Better Auth needs to access sessions)
   - `NEXT_PUBLIC_API_URL`: `https://evaluation-todo.vercel.app` (backend URL from step 1)

4. The frontend will be deployed to: `https://ai-based-todo.vercel.app/`

## Critical Configuration Notes

- ✅ `JWT_SECRET` (backend) MUST match `BETTER_AUTH_SECRET` (frontend)
- ✅ Both apps must use the same `DATABASE_URL` for session sharing
- ✅ Backend CORS must allow the frontend origin
- ✅ Frontend `NEXT_PUBLIC_API_URL` must point to the deployed backend URL

## Verifying Successful Deployment

### Backend Verification
```bash
# Should return pong
curl https://evaluation-todo.vercel.app/api/ping

# Should return 401 Unauthorized (requires authentication)
curl https://evaluation-todo.vercel.app/api/tasks/
```

### Frontend Verification
1. Visit the frontend URL
2. Sign up for a new account
3. Create and verify tasks work properly
4. Check that the JWT bridge is functioning (inspect network tab for `/api/auth/jwt` calls)

## Troubleshooting

### Issue: "Session expired or unauthorized"
**Cause**: JWT secret mismatch between frontend and backend
**Fix**: Verify `BETTER_AUTH_SECRET` (frontend) matches `JWT_SECRET` (backend)

### Issue: CORS Error
**Cause**: Backend doesn't allow frontend origin
**Fix**: Ensure frontend URL is in backend's `allow_origins` list

### Issue: "[AuthGuard] BetterAuth error: {}"
**Cause**: Better Auth session issue
**Fix**: Check `DATABASE_URL` is set correctly in frontend and matches backend

## Local Development

For local development, use `.env.local` files:

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=b218af51b238aaece19c4ab3d8af8d32
DATABASE_URL=postgresql://...
```

Backend `.env`:
```env
JWT_SECRET=b218af51b238aaece19c4ab3d8af8d32
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://...
```