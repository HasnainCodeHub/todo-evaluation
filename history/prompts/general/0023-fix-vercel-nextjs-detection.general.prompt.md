---
id: 0023
title: Fix Vercel NextJS Detection
stage: general
date: 2026-01-16
surface: agent
model: gemini-1.5-flash-latest
feature: none
branch: 001-cli-task-crud
user: user
command: (build error: No Next.js version detected)
labels: ["vercel", "fix", "config"]
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

(User reported "No Next.js version detected")

## Response snapshot

I reverted `vercel.json` to use the `builds` array configuration. The previous attempt to use "modern" root-level properties failed because Vercel looks for `package.json` in the project root to detect the framework, but the app is in `frontend/`.

By restoring the `builds` configuration:
```json
{
  "builds": [
    { "src": "frontend/package.json", "use": "@vercel/next" }
  ]
}
```
Vercel will correctly identify the Next.js app in the subdirectory. I also added a `routes` section to ensure traffic is correctly routed to the frontend.

Combined with the previously added `frontend/public` directory, this should resolve the "No Output Directory" error as well.

## Outcome

- ✅ Impact: Restored valid Vercel configuration for subdirectory deployment.
- 🧪 Tests: none (deployment test)
- 📁 Files: vercel.json
- 🔁 Next prompts: Monitor next build.
- 🧠 Reflection: Monorepo deployment on Vercel via `vercel.json` requires the legacy `builds` key if the Root Directory setting in the UI is not changed.

## Evaluation notes (flywheel)

- Failure modes observed: Vercel framework detection failure.
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
