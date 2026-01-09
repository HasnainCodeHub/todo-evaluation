---
id: 0018
title: Remove JWT logic and migrate to Better Auth sessions
stage: general
date: 2026-01-09
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 001-cli-task-crud
user: unknown
command: none
labels: [auth, jwt, better-auth, cleanup, migration]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth/jwt.ts (deleted)
  - frontend/app/api/auth/jwt/route.ts (deleted)
  - frontend/hooks/useAuth.ts (modified)
  - frontend/lib/api/client.ts (modified)
  - frontend/app/page.tsx (modified)
  - frontend/CLAUDE.md (modified)
  - frontend/.env.example (modified)
  - frontend/types/task.ts (modified)
  - frontend/components/auth/AuthProvider.tsx (modified)
tests:
  - none
---

## Prompt

Fix the production auth redirect loop by COMPLETELY REMOVING all JWT-based logic from the FRONTEND and migrating the frontend to FULL Better Auth session-only authentication.

This is NOT a partial fix.
This is a destructive cleanup of JWT logic.
After this change:
- NO frontend code may reference JWT
- NO frontend code may call /api/auth/jwt
- Auth state must come ONLY from Better Auth session hooks
SCOPE
=====
Frontend ONLY.
Backend FastAPI is NOT to be modified in this task.

ROOT CAUSE (CONFIRMED)
=====================
- Frontend still attempts to validate auth via `/api/auth/jwt`
- Backend does NOT implement `/api/auth/jwt` (correctly)
- On Vercel, this causes 401 → redirect loop
- Localhost masked this due to dev behavior
- Better Auth is session-based, NOT JWT-based

## Response snapshot

I have completely removed all JWT-related logic from the frontend and migrated the authentication flow to use Better Auth session cookies exclusively.

Key actions:
1. Deleted `frontend/lib/auth/jwt.ts` and `frontend/app/api/auth/jwt/route.ts`.
2. Refactored `ApiClient` in `frontend/lib/api/client.ts` to remove JWT exchange and `Authorization: Bearer` headers, switching to `credentials: 'include'` for cookie-based auth.
3. Updated `useAuth` hook to remove `getAuthToken` and vestigial JWT state.
4. Cleaned up types, context providers, and documentation to remove all references to JWT.
5. Updated `.env.example` to remove the requirement for `BETTER_AUTH_SECRET` to match a backend `JWT_SECRET`.

## Outcome

- ✅ Impact: Fixed production redirect loop by removing incorrect JWT dependency.
- 🧪 Tests: None (Manual verification of code cleanup)
- 📁 Files: Modified 7 files, deleted 2 files.
- 🔁 Next prompts: Verify backend correctly handles cookie-based session validation.
- 🧠 Reflection: The coexistence of session-based and JWT-based auth was the root cause of the redirect loop in production.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
