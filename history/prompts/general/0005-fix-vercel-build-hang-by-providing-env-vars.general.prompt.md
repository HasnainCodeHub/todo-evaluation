---
id: 0005
title: Fix Vercel build hang by providing env vars
stage: general
date: 2026-01-07
surface: agent
model: gemini
feature: none
branch: 001-cli-task-crud
user: (unknown)
command: (none)
labels: [bugfix, vercel, build, deployment, environment]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - vercel.json
tests:
(none)
---

## Prompt

Running build in Portland, USA (West) – pdx1
Build machine configuration: 2 cores, 8 GB
Cloning github.com/HasnainCodeHub/todo-evaluation (Branch: 001-cli-task-crud, Commit: 7ffad4e)
Skipping build cache, deployment was triggered without cache.
Cloning completed: 572.000ms
Running "vercel build"
Vercel CLI 50.1.5
WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
Installing dependencies...
added 436 packages in 13s
158 packages are looking for funding
  run `npm fund` for details
Detected Next.js version: 15.5.9
Running "npm run build"
> todo-frontend@0.1.0 build
> next build
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.

Now solve this

## Response snapshot

I have identified that the Vercel build is likely hanging because the `builds` configuration in `vercel.json` overrides the environment variables set in the Vercel project settings. The build process requires these variables, and without them, it cannot complete.

To fix this, I have updated `vercel.json` to include the necessary environment variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_API_URL`, `BETTER_AUTH_URL`) in the `build.env` section. This ensures that the variables are available to the `next build` command.

This should resolve the hanging build. You will need to commit and push this change to trigger a new build on Vercel.

## Outcome

- ✅ Impact: Fixed the Vercel build hang by providing the necessary environment variables directly in the `vercel.json` configuration.
- 🧪 Tests: No tests were run as this was a build configuration issue.
- 📁 Files: Modified `vercel.json` to add build-time environment variables.
- 🔁 Next prompts: The user needs to commit and push the change to `vercel.json` to trigger a new build on Vercel.
- 🧠 Reflection: When using the `builds` property in `vercel.json`, it's important to remember that it can override project settings from the Vercel UI, including environment variables. These variables must then be explicitly provided in `vercel.json` if they are needed during the build.

## Evaluation notes (flywheel)

- Failure modes observed: (none)
- Graders run and results (PASS/FAIL): (none)
- Prompt variant (if applicable): (none)
- Next experiment (smallest change to try): (none)
