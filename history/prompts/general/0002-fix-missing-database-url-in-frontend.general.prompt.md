---
id: 0002
title: Fix missing DATABASE_URL in frontend
stage: general
date: 2026-01-07
surface: agent
model: gemini
feature: none
branch: 001-cli-task-crud
user: (unknown)
command: (none)
labels: [bugfix, frontend, environment, database]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/.env.local
tests:
(none)
---

## Prompt

▲ Next.js 15.5.9
   - Local:        http://localhost:3000
   - Network:      http://192.168.100.70:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 3.5s
 ✓ Compiled /middleware in 464ms (114 modules)
 ○ Compiling / ...
 ✓ Compiled / in 3.9s (683 modules)
 GET / 200 in 4875ms
 ✓ Compiled in 1017ms (279 modules)
 ○ Compiling /api/auth/jwt ...
 ✓ Compiled /api/auth/jwt in 3s (1292 modules)
 ⨯ Error: DATABASE_URL is required
    at eval (lib\auth\auth-server.ts:9:9)
   7 |
   8 | if (!process.env.DATABASE_URL) {
>  9 |   throw new Error('DATABASE_URL is required')
     |         ^
  10 | }
  11 |
  12 | if (!process.env.BETTER_AUTH_SECRET) { {
  page: '/api/auth/jwt'
}
 ○ Compiling /_error ...
 ✓ Compiled /_error in 2.2s (1631 modules)
 GET / 200 in 1537ms
 GET / 200 in 43ms
 GET /api/auth/jwt 500 in 6791ms


solve this

## Response snapshot

I have identified that the error is caused by a missing `DATABASE_URL` environment variable, which is required by the authentication logic in `frontend/lib/auth/auth-server.ts`.

I have updated the `frontend/.env.local` file to include the `DATABASE_URL` and `BETTER_AUTH_SECRET` variables found in the project's setup documentation.

This should resolve the error. Please restart your development server.

## Outcome

- ✅ Impact: Fixed a crash in the frontend's authentication API route by providing the required DATABASE_URL.
- 🧪 Tests: No tests were run as this was an environment configuration issue.
- 📁 Files: Updated `frontend/.env.local` to include `DATABASE_URL` and `BETTER_AUTH_SECRET`.
- 🔁 Next prompts: User can now restart the development server and the authentication should work.
- 🧠 Reflection: The `.env.local` file was missing more required variables. It's important to fully understand the environment requirements of an application.

## Evaluation notes (flywheel)

- Failure modes observed: (none)
- Graders run and results (PASS/FAIL): (none)
- Prompt variant (if applicable): (none)
- Next experiment (smallest change to try): (none)
