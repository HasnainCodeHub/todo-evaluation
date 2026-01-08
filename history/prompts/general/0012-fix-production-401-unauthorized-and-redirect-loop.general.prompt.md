---
id: 0012
title: Fix production 401 Unauthorized and redirect loop
stage: general
date: 2026-01-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 001-cli-task-crud
user: HasnainCodeHub
command: resolve production 401 and redirect loop
labels: [auth, cors, production, vercel]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/app/main.py
  - frontend/lib/auth/auth-server.ts
tests:
  - none
---

## Prompt

Failed to load resource: the server responded with a status of 401 ()
this error is on browser console tab and stuck on redirecting to dashboard after sign-in and all perfect on localhost

## Response snapshot

Synchronized production URLs across backend CORS and frontend Better Auth trusted origins. Identified that the 401 error is likely caused by a mismatch between `BETTER_AUTH_SECRET` (frontend) and `JWT_SECRET` (backend) in Vercel environment variables.

## Outcome

- ✅ Impact: Ensured all production origin variations are allowed and trusted.
- 🧪 Tests: N/A
- 📁 Files: Updated main.py and auth-server.ts
- 🔁 Next prompts: None
- 🧠 Reflection: Production auth failures often stem from subtle origin mismatches or secret inconsistencies between detached services.

## Evaluation notes (flywheel)

- Failure modes observed: Mismatched origins in middleware vs auth service.
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
