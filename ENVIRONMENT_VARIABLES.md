# Environment Variables Reference

## Quick Copy-Paste for Vercel

### Frontend Environment Variables

**Copy these into Vercel Dashboard → Settings → Environment Variables**

#### Variable 1: BETTER_AUTH_SECRET
```
b218af51b238aaece19c4ab3d8af8d32
```
**Environments**: Production, Preview, Development
**Critical**: Must match JWT_SECRET on backend

#### Variable 2: DATABASE_URL
```
postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
**Environments**: Production, Preview, Development
**Critical**: Same database as backend

#### Variable 3: NEXT_PUBLIC_API_URL
```
https://evaluation-todo.vercel.app
```
**Environments**: Production only
**Critical**: Must be backend URL

---

## Backend Environment Variables (Already Set)

These should already be configured in your backend Vercel project:

```env
JWT_SECRET=b218af51b238aaece19c4ab3d8af8d32
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Local Development (.env.local)

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=b218af51b238aaece19c4ab3d8af8d32
DATABASE_URL=postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Backend** (`backend/.env`):
```env
JWT_SECRET=b218af51b238aaece19c4ab3d8af8d32
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## How to Set in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your frontend project (`todo-evaluation`)
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. For each variable:
   - Click "Add New"
   - Enter variable name
   - Enter value
   - Select environments (Production, Preview, Development)
   - Click "Save"

---

## Critical Rules

### ⚠️ Security Rules

1. **NEVER** commit `.env.local` or `.env` to Git
2. **ALWAYS** use environment variables for secrets
3. **ROTATE** secrets periodically
4. **BACKUP** all secrets in a secure vault

### ✅ Matching Rules

1. `BETTER_AUTH_SECRET` (frontend) **MUST** equal `JWT_SECRET` (backend)
2. `DATABASE_URL` **MUST** be the same on frontend and backend
3. `NEXT_PUBLIC_API_URL` **MUST** point to backend URL

### 🔒 Verification

Run this check locally:

```bash
# Frontend
cd frontend
node -e "console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET?.substring(0,10) + '...')"

# Backend
cd ../backend
python -c "import os; print('JWT_SECRET:', os.getenv('JWT_SECRET')[:10] + '...')"

# They should match!
```

---

## Environment Variable Matrix

| Variable | Frontend | Backend | Must Match | Public |
|----------|----------|---------|------------|--------|
| `BETTER_AUTH_SECRET` | ✅ | ❌ | With JWT_SECRET | ❌ |
| `JWT_SECRET` | ❌ | ✅ | With BETTER_AUTH_SECRET | ❌ |
| `JWT_ALGORITHM` | ❌ | ✅ | N/A | ❌ |
| `DATABASE_URL` | ✅ | ✅ | Yes (same DB) | ❌ |
| `NEXT_PUBLIC_API_URL` | ✅ | ❌ | N/A | ✅ |
| `VERCEL` | Auto | Auto | N/A | ✅ |
| `VERCEL_URL` | Auto | Auto | N/A | ✅ |

**Legend**:
- ✅ Required
- ❌ Not used
- Auto = Automatically set by Vercel
- Public = Can be exposed to browser (NEXT_PUBLIC_*)

---

## Troubleshooting

### Secrets Don't Match

**Symptoms**: "Authentication required" errors

**Fix**:
```bash
# Verify on Vercel
vercel env ls

# Ensure BETTER_AUTH_SECRET (frontend) = JWT_SECRET (backend)
```

### Missing Environment Variables

**Symptoms**: Build failures or runtime errors

**Fix**:
1. Check Vercel build logs
2. Verify all required variables are set
3. Redeploy after adding missing variables

### Wrong Backend URL

**Symptoms**: Network errors, "Cannot connect to backend"

**Fix**:
1. Verify `NEXT_PUBLIC_API_URL=https://evaluation-todo.vercel.app`
2. Check browser Network tab for actual URL being called
3. Update and redeploy

---

**Last Updated**: 2026-01-09
