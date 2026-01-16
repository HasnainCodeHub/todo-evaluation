---
id: 0026
title: Fix Vercel Dirname Reference Error
stage: general
date: 2026-01-16
surface: agent
model: gemini-1.5-flash-latest
feature: none
branch: 001-cli-task-crud
user: user
command: (Logs: ReferenceError: __dirname is not defined)
labels: ["vercel", "fix", "dependencies", "better-sqlite3"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/package.json
tests:

---

## Prompt

(User provided logs with `[ReferenceError: __dirname is not defined]`)

## Response snapshot

I analyzed the `ReferenceError: __dirname is not defined` error occurring at runtime on Vercel. This error typically happens when a Node.js native module (which relies on CommonJS globals like `__dirname`) is bundled into an environment that doesn't support it, such as the Edge Runtime (used by Middleware) or when bundled inappropriately for Server Components in ESM mode.

I found that `better-sqlite3` was listed in `dependencies` in `frontend/package.json`. Even though it wasn't explicitly imported in the application code, its presence in `dependencies` likely caused the build tools or `better-auth` (which has optional SQLite support) to attempt to bundle or load it, leading to the crash.

I moved `better-sqlite3` to `devDependencies` since the production environment uses PostgreSQL (via `pg`). This prevents it from being included in the production build artifact.

## Outcome

- ✅ Impact: Removed incompatible Node.js native module from production bundle.
- 🧪 Tests: none (deployment test)
- 📁 Files: frontend/package.json
- 🔁 Next prompts: Monitor next build.
- 🧠 Reflection: Native modules in `dependencies` are a common trap for Next.js deployments, especially when targeting serverless/edge environments where binary compatibility and CommonJS support are strict.

## Evaluation notes (flywheel)

- Failure modes observed: Native module causing runtime crash in serverless.
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
