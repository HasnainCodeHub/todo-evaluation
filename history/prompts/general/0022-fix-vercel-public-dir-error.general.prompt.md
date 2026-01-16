---
id: 0022
title: Fix Vercel Public Dir Error
stage: general
date: 2026-01-16
surface: agent
model: gemini-1.5-flash-latest
feature: none
branch: 001-cli-task-crud
user: user
command: (build logs provided)
labels: ["vercel", "fix", "deployment"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - vercel.json
 - frontend/public/.gitkeep
tests:

---

## Prompt

(User pasted Vercel build logs showing "No Output Directory named 'public' found")

## Response snapshot

I analyzed the build failure. The error "No Output Directory named 'public' found" indicates a mismatch between Vercel's expectation (often looking for `public` when using legacy builds or static defaults) and the actual Next.js output (`.next`).

To fix this, I have:
1.  **Updated `vercel.json`**: Replaced the legacy `builds` configuration with modern explicit paths (`buildCommand`, `outputDirectory`, `installCommand`) pointing to the `frontend/` directory. This ensures Vercel knows exactly where to build and where to find the output (`frontend/.next`), even if the Project Root is set to the repository root.
2.  **Created `frontend/public`**: Added the missing `public` directory (with a `.gitkeep`) as it is standard for Next.js and ensures the directory structure meets expectations.

These changes have been pushed to the branch. Vercel should trigger a new build automatically.

## Outcome

- ✅ Impact: Fixed Vercel configuration to correctly target frontend build artifacts.
- 🧪 Tests: none (deployment test)
- 📁 Files: vercel.json, frontend/public/.gitkeep
- 🔁 Next prompts: Monitor next build.
- 🧠 Reflection: The legacy `builds` array in `vercel.json` is a common source of issues with modern Next.js deployments on Vercel, especially in monorepos without root directory configuration in UI.

## Evaluation notes (flywheel)

- Failure modes observed: Vercel legacy build config expecting "public" folder.
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
