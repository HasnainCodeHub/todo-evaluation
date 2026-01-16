---
id: 0024
title: Fix Vercel Middleware Error
stage: general
date: 2026-01-16
surface: agent
model: gemini-1.5-flash-latest
feature: none
branch: 001-cli-task-crud
user: user
command: (500: INTERNAL_SERVER_ERROR Code: MIDDLEWARE_INVOCATION_FAILED)
labels: ["vercel", "fix", "middleware"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - vercel.json
tests:

---

## Prompt

(User reported "500: INTERNAL_SERVER_ERROR Code: MIDDLEWARE_INVOCATION_FAILED")

## Response snapshot

I identified that the `MIDDLEWARE_INVOCATION_FAILED` error was likely caused by the manual `routes` configuration in `vercel.json` conflicting with the `@vercel/next` builder's automatic routing.

The manual route `{ "src": "/(.*)", "dest": "/frontend/$1" }` attempts to rewrite all requests to `frontend/`, but since `@vercel/next` handles the build and routing internally (lifting the app to the root context in the deployment), this rewrite was likely causing path resolution issues or unexpected behavior in the Edge Middleware.

I have removed the `routes` section from `vercel.json`, relying solely on the `builds` configuration to handle the Next.js application deployment correctly.

## Outcome

- ✅ Impact: Removed conflicting routing configuration to resolve middleware invocation failure.
- 🧪 Tests: none (deployment test)
- 📁 Files: vercel.json
- 🔁 Next prompts: Monitor next build.
- 🧠 Reflection: When using framework-specific builders like `@vercel/next`, manual routing logic often interferes with the framework's internal routing and middleware handling.

## Evaluation notes (flywheel)

- Failure modes observed: Vercel middleware crash due to routing conflict.
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
