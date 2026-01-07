---
id: 0009
title: Hardcode production backend URL
stage: general
date: 2026-01-07
surface: agent
model: gemini
feature: none
branch: 001-cli-task-crud
user: (unknown)
command: (none)
labels: [refactor, configuration, deployment, production]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/lib/config.ts
tests:
(none)
---

## Prompt

https://evaluation-todo.vercel.app/ update this url for productions request in my code base

## Response snapshot

I have updated the codebase to ensure the production backend URL (`https://evaluation-todo.vercel.app/`) is always used for production builds.

I have modified `frontend/lib/config.ts` to check if the environment is `production`. If it is, the function will return the hardcoded production URL, ignoring any environment variables. For all other environments (like local development), it will continue to use the `NEXT_PUBLIC_API_URL` environment variable or a `localhost` fallback.

This makes your production deployment more robust against configuration errors.

## Outcome

- ✅ Impact: Hardcoded the production backend URL directly into the code to ensure production builds always point to the correct API endpoint, reducing reliance on environment variables for production.
- 🧪 Tests: No tests were run.
- 📁 Files: Modified `frontend/lib/config.ts`.
- 🔁 Next prompts: The user needs to commit and push this change to have it reflected in their production deployment.
- 🧠 Reflection: While using environment variables is generally a best practice, for a critical and stable URL like a production API endpoint, hardcoding it for the production build can increase reliability and prevent configuration-related deployment failures.

## Evaluation notes (flywheel)

- Failure modes observed: (none)
- Graders run and results (PASS/FAIL): (none)
- Prompt variant (if applicable): (none)
- Next experiment (smallest change to try): (none)
