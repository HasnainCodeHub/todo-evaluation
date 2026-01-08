---
id: 0015
title: Fix production auth redirect loop and JWT usage
stage: general
date: 2026-01-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 001-cli-task-crud
user: HasnainCodeHub
command: Fix infinite Redirecting to dashboard loop by correcting frontend auth flow
labels: [auth, better-auth, jwt, production]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/hooks/useAuth.ts
  - frontend/components/auth/AuthGuard.tsx
  - frontend/app/dashboard/page.tsx
  - frontend/lib/api/client.ts
tests:
  - none
---

## Prompt

Fix the infinite “Redirecting to dashboard…” loop in production by correcting frontend authentication flow. The application currently misuses /api/auth/jwt as a route-guard signal.

## Response snapshot

Refactored the frontend to use Better Auth `useSession()` as the sole source of truth for authentication state and routing. Implemented a production-grade `AuthGuard` and corrected `ApiClient` to use `/api/auth/jwt` exclusively for backend token exchange.

## Outcome

- ✅ Impact: Resolved production redirect loops and stabilized authentication flow.
- 🧪 Tests: N/A
- 📁 Files: Updated useAuth, AuthProvider, ApiClient, Dashboard, and SignIn. Created AuthGuard.
- 🔁 Next prompts: None
- 🧠 Reflection: Decoupling session state (for UI/Routing) from API tokens (for backend auth) is critical for stable production deployments.

## Evaluation notes (flywheel)

- Failure modes observed: Using a side-effect-heavy API endpoint as a routing signal.
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
