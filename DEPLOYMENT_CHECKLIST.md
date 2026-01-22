# 🚀 Vercel Deployment Checklist

## Pre-Deployment Verification

### Backend Status ✅
- [x] Backend deployed at: https://evaluation-todo.vercel.app/
- [x] Backend CORS updated to allow frontend origin
- [x] JWT_SECRET configured in backend environment variables

### Frontend Changes ✅
- [x] API client updated with JWT bridge pattern
- [x] JWT bridge route created at `/api/auth/jwt`
- [x] Frontend config points to correct backend URL
- [x] Better Auth trusted origins updated
- [x] AuthGuard updated for session handling
- [x] Error handling for SESSION_INVALID errors

### Code Review ✅
- [x] No hardcoded secrets in code
- [x] All environment variables use process.env
- [x] CORS configured with specific origins (not wildcards)
- [x] JWT expiration set (15 minutes)
- [x] Production URL configuration correct

---

## Vercel Frontend Deployment Steps

### 1. Environment Variables Setup

Navigate to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add the following variables for **Production**, **Preview**, and **Development**:

#### Critical Variables (MUST SET)

```
BETTER_AUTH_SECRET=b218af51b238aaece19c4ab3d8af8d32
```
**Important**: This MUST match JWT_SECRET on backend!

```
DATABASE_URL=postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
**Important**: Same database as backend for Better Auth sessions!

```
NEXT_PUBLIC_API_URL=https://evaluation-todo.vercel.app
```
**Important**: Must be the backend URL!

### 2. Deploy Frontend

```bash
# Commit all changes
git add .
git commit -m "feat: Bridge pattern authentication ready for production"
git push origin main
```

### 3. Trigger Deployment

- **Option A**: Push to main branch (auto-deploy)
- **Option B**: Manual deploy from Vercel dashboard
- **Option C**: Use Vercel CLI: `vercel --prod`

### 4. Monitor Build

Watch the deployment logs for:
- ✅ Build success
- ✅ No environment variable errors
- ✅ No TypeScript errors
- ✅ Successful deployment

---

## Post-Deployment Testing

### Test 1: Backend Connectivity ✅

```bash
# Test backend is accessible
curl https://evaluation-todo.vercel.app/api/ping

# Expected: {"ping":"pong","cors":"enabled"}
```

### Test 2: Frontend Loads ✅

Visit: https://ai-based-todo.vercel.app/

**Expected**:
- Landing page loads
- No console errors
- "Sign In" and "Sign Up" buttons visible

### Test 3: User Registration ✅

1. Click "Sign Up"
2. Enter email and password
3. Submit form

**Expected**:
- No errors
- Redirect to dashboard
- User sees welcome message

### Test 4: JWT Bridge ✅

**In Browser DevTools Network Tab**:

1. Create a task
2. Find `POST /api/auth/jwt` request

**Expected**:
- Status: 200
- Response: `{ "token": "eyJ..." }`

### Test 5: Backend Authentication ✅

**In Browser DevTools Network Tab**:

1. Create a task
2. Find `POST https://evaluation-todo.vercel.app/api/tasks/` request
3. Check Request Headers

**Expected**:
- Header: `Authorization: Bearer eyJ...`
- Status: 200 or 201
- Response: Task object with user_id

### Test 6: User-Scoped Data ✅

1. Create 2-3 tasks
2. Sign out
3. Sign up with different email
4. Check dashboard

**Expected**:
- New user sees empty task list
- First user's tasks not visible

### Test 7: Session Persistence ✅

1. Create a task
2. Refresh page (F5)

**Expected**:
- Still authenticated
- Task still visible
- No redirect to sign in

### Test 8: Protected Routes ✅

1. Sign out
2. Try to access: https://ai-based-todo.vercel.app/dashboard

**Expected**:
- Redirect to `/signin`
- AuthGuard working correctly

---

## Verification Commands

### Check Environment Variables (Vercel CLI)

```bash
vercel env ls
```

### View Deployment Logs

```bash
vercel logs https://ai-based-todo.vercel.app/
```

### Test Local Production Build

```bash
cd frontend
npm run build
npm run start
# Visit http://localhost:3000
```

---

## Common Issues & Fixes

### ❌ Issue: "Authentication required" on all requests

**Cause**: JWT secret mismatch

**Fix**:
```bash
# Verify on backend
echo $JWT_SECRET

# Verify on frontend
vercel env ls | grep BETTER_AUTH_SECRET

# They MUST match!
```

### ❌ Issue: CORS error in browser console

**Cause**: Backend doesn't allow frontend origin

**Fix**:
1. Check backend `main.py` line 32
2. Ensure `https://ai-based-todo.vercel.app` is in `allow_origins`
3. Redeploy backend

### ❌ Issue: "[AuthGuard] BetterAuth error: {}"

**Cause**: Better Auth session invalid

**Fix**:
1. Clear browser cookies
2. Verify `DATABASE_URL` is set in frontend
3. Check frontend Vercel logs for Better Auth errors

### ❌ Issue: "Failed to obtain authentication token"

**Cause**: JWT bridge route failing

**Fix**:
1. Check `/api/auth/jwt` in Vercel Function logs
2. Verify `BETTER_AUTH_SECRET` environment variable is set
3. Test locally first

---

## Production URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://ai-based-todo.vercel.app/ | User interface |
| Backend | https://evaluation-todo.vercel.app/ | REST API |
| JWT Bridge | https://ai-based-todo.vercel.app/api/auth/jwt | Session → JWT |
| Better Auth | https://ai-based-todo.vercel.app/api/auth/* | Authentication |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Browser (User)                                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 1. Visit app
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: https://ai-based-todo.vercel.app/          │
│  - Better Auth (session cookies)                        │
│  - AuthGuard (route protection)                         │
│  - React components                                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 2. Create task
                  ▼
┌─────────────────────────────────────────────────────────┐
│  JWT Bridge: /api/auth/jwt (Next.js API Route)          │
│  - Reads Better Auth session                            │
│  - Generates JWT token                                  │
│  - Signs with BETTER_AUTH_SECRET                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 3. Authorization: Bearer <JWT>
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Backend: https://evaluation-todo.vercel.app/           │
│  - Validates JWT                                        │
│  - Extracts user_id from token                          │
│  - Returns user-scoped data                             │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 4. Database query
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Neon PostgreSQL                                        │
│  - User accounts (Better Auth)                          │
│  - User sessions (Better Auth)                          │
│  - Tasks (user_id scoped)                               │
└─────────────────────────────────────────────────────────┘
```

---

## Success Criteria ✅

- [ ] Frontend deployed successfully
- [ ] Environment variables configured
- [ ] User can sign up
- [ ] User can sign in
- [ ] JWT bridge returns valid tokens
- [ ] Backend accepts JWT authentication
- [ ] Tasks are user-scoped
- [ ] Session persists on refresh
- [ ] Protected routes redirect correctly
- [ ] No CORS errors
- [ ] No authentication errors in console

---

## Next Steps After Deployment

1. **Monitor Errors**: Check Vercel logs for runtime errors
2. **Performance**: Monitor page load times
3. **Security**: Regularly rotate secrets
4. **Backup**: Keep DATABASE_URL and secrets in secure vault
5. **Updates**: Follow Vercel deployment notifications

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Status**: ⬜ Pending | ⬜ In Progress | ⬜ Completed | ⬜ Failed
