---
id: 0010
title: Fix client-side access to auth URL env var
stage: general
date: 2026-01-07
surface: agent
model: gemini
feature: none
branch: 001-cli-task-crud
user: (unknown)
command: (none)
labels: [bugfix, vercel, deployment, environment, nextjs]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/lib/auth-client.ts
tests:
(none)
---

## Prompt

## Error Type
Runtime Error

## Error Message
CRITICAL: BETTER_AUTH_URL environment variable is not set.


    at eval (lib\auth\auth-client.ts:12:9)
    at (app-pages-browser)/./lib/auth/auth-client.ts (.next\static\chunks\app\layout.js:51:1)
    at eval (webpack-internal:///(app-pages-browser)/./hooks/useAuth.ts:7:79)
    at (app-pages-browser)/./hooks/useAuth.ts (.next\static\chunks\app\layout.js:40:1)
    at eval (webpack-internal:///(app-pages-browser)/./components/auth/AuthProvider.tsx:9:72)
    at (app-pages-browser)/./components/auth/AuthProvider.tsx (.next\static\chunks\app\layout.js:29:1)
    at RootLayout (app\layout.tsx:55:9)

## Code Frame
  10 | if (!authBaseURL) {
  11 |   // This check is critical. In a production environment, we must have this URL.
> 12 |   throw new Error("CRITICAL: BETTER_AUTH_URL environment variable is not set.");
     |         ^
  13 | }
  14 |
  15 | // Create Better Auth client

Next.js version: 15.5.9 (Webpack)
 solve this bitch

## Response snapshot

I have identified the root cause of the error. The application is failing because it's trying to access a server-side environment variable (`BETTER_AUTH_URL`) in the browser. In Next.js, only variables prefixed with `NEXT_PUBLIC_` are available on the client side.

I have fixed this by updating `frontend/lib/auth/auth-client.ts` to look for `NEXT_PUBLIC_BETTER_AUTH_URL` instead.

**To resolve this issue, you must now do two things:**

1.  **Update the environment variable name in your Vercel project settings.**
2.  **Redeploy the application with my latest code change.**

Here are the detailed instructions:

1.  **In your FRONTEND Vercel project (`todo-evaluation.vercel.app`):**
    *   Go to **Settings -> Environment Variables**.
    *   **Edit** the `BETTER_AUTH_URL` variable and **rename it** to `NEXT_PUBLIC_BETTER_AUTH_URL`. The value should remain `https://todo-evaluation.vercel.app`.

2.  **Redeploy the project:**
    *   Pull my latest changes from the `001-cli-task-crud` branch.
    *   Trigger a new deployment on Vercel for that branch.

This will ensure the frontend code can access its own URL and the authentication flow will work correctly.

## Outcome

- ✅ Impact: Corrected a fundamental bug in how client-side environment variables were being accessed, which was the root cause of the runtime error.
- 🧪 Tests: No tests were run.
- 📁 Files: Modified `frontend/lib/auth-client.ts`.
- 🔁 Next prompts: The user needs to rename the environment variable on Vercel and redeploy the latest commit.
- 🧠 Reflection: It is critical to remember the distinction between server-side and client-side environment variables in Next.js. All variables needed in the browser must be prefixed with `NEXT_PUBLIC_`.

## Evaluation notes (flywheel)

- Failure modes observed: (none)
- Graders run and results (PASS/FAIL): (none)
- Prompt variant (if applicable): (none)
- Next experiment (smallest change to try): (none)
