---
id: 0008
title: Add build-time check for environment variables
stage: general
date: 2026-01-07
surface: agent
model: gemini
feature: none
branch: 001-cli-task-crud
user: (unknown)
command: (none)
labels: [bugfix, vercel, build, deployment, environment, debugging]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/next.config.js
tests:
(none)
---

## Prompt

BETTER_AUTH_URL
All Environments

https://todo-evaluation.vercel.app
Added 1m ago


NEXT_PUBLIC_API_URL
All Environments

https://evaluation-todo.vercel.app/
Added 5m ago


DATABASE_URL
All Environments

postgresql://neondb_owner:npg_1LxTpn7XOUPc@ep-noisy-art-ahv56il4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Added 5m ago


BETTER_AUTH_SECRET
All Environments

b218af51b238aaece19c4ab3d8af8d32
Added 5m ago
 these are my frontend env variables on vercel but causing same error

## Response snapshot

I have analyzed the situation and it seems the environment variables are not being correctly picked up during the Vercel build process, for reasons that are not clear from the logs.

To get a definitive answer, I have implemented a more robust debugging strategy. I have updated `frontend/next.config.js` to explicitly check for the required environment variables at the very start of the build process. If any of the critical variables are missing, the build will now fail with a clear error message stating which ones are missing.

This will tell us for sure if the problem is that the environment variables are not being made available to the build container.

Please pull the latest changes and redeploy on Vercel, then provide the new build log.

## Outcome

- ✅ Impact: Implemented a fail-fast mechanism in the build process to reliably detect missing environment variables, which is the suspected root cause of the deployment issue.
- 🧪 Tests: No tests were run as this was a debugging and configuration change.
- 📁 Files: Modified `frontend/next.config.js` to add build-time checks.
- 🔁 Next prompts: The user needs to commit the changes and trigger a new build on Vercel to see the output of the new checks.
- 🧠 Reflection: When debugging elusive environment-related issues in a CI/CD environment, it's effective to add explicit checks that will fail the build with a clear error message, rather than relying on logs that may not be visible.

## Evaluation notes (flywheel)

- Failure modes observed: (none)
- Graders run and results (PASS/FAIL): (none)
- Prompt variant (if applicable): (none)
- Next experiment (smallest change to try): (none)
