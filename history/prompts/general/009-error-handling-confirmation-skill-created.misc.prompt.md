---
id: 009
title: Error Handling & Confirmation Skill Created
stage: misc
date: 2026-01-24
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: 001-cli-task-crud
user: HasnainCodeHub
command: skill-creator-pro
labels: ["error-handling", "ux", "confirmations", "skill", "polish"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .claude/skills/error-handling-confirmation/skill.md
  - .claude/skills/error-handling-confirmation/references/error-catalog.md
  - .claude/skills/error-handling-confirmation/references/message-templates.md
  - .claude/skills/error-handling-confirmation/references/ux-patterns.md
tests:
  - null
---

## Prompt

Now create a skill using skill-creator-pro name : Error Handling & Confirmation and on the given requirements:

Why it's needed

Docs explicitly require:

Friendly confirmations

Graceful error handling

Task not found responses

What this skill does

Normalizes errors

Produces human-friendly replies

Prevents silent failures

Covers

Error handling section

UX correctness

Agent response quality

📌 This is polish + safety.

## Response snapshot

Created comprehensive "Error Handling & Confirmation" skill using skill-creator-pro methodology:

**Domain Research Conducted:**
1. Error handling UX best practices (NN/G, Smashing Magazine, CXL)
2. API error response design patterns (RFC 9457, Baeldung, Postman)
3. Chatbot/AI agent error handling and graceful degradation

**Codebase Analysis:**
- Reviewed existing error handling in FastAPI backend (HTTPException patterns)
- Reviewed frontend Toast system, validation messages, empty states
- Identified existing patterns to align with (403 vs 404 distinction)

**Skill Files Created:**

1. `skill.md` - Main skill covering:
   - Core principles (never blame user, be specific, plain language)
   - Error response patterns with HTTP status mapping
   - Confirmation patterns (success messages, visual hierarchy)
   - Graceful degradation strategies
   - Message templates and anti-patterns

2. `references/error-catalog.md` - Complete error code catalog:
   - Auth errors (401), Authorization (403), Not Found (404)
   - Validation (400), Server (500), Service Unavailable (503)
   - Network errors (client-side)
   - Standardized error response schema

3. `references/message-templates.md` - Copy-paste templates:
   - Error messages by category
   - Success/confirmation messages
   - Empty state messages
   - Chatbot fallback responses
   - Tone guidelines and i18n notes

4. `references/ux-patterns.md` - Visual patterns:
   - Feedback hierarchy (modal → inline → toast → indicator)
   - Toast/snackbar implementation
   - Inline form errors
   - Loading states and animations
   - Accessibility considerations

## Outcome

- ✅ Impact: High - Provides consistent error handling and UX polish across application
- 🧪 Tests: N/A - Guide skill with reference patterns
- 📁 Files: 4 files created (skill.md + 3 references)
- 🔁 Next prompts: Apply patterns to existing codebase, create validation script
- 🧠 Reflection: Domain research + codebase analysis ensured skill aligns with existing patterns while adding comprehensive guidance

## Evaluation notes (flywheel)

- Failure modes observed: None - all web searches successful
- Graders run and results (PASS/FAIL): N/A - skill creation task
- Prompt variant (if applicable): Used skill-creator-pro methodology
- Next experiment (smallest change to try): Test skill application in actual error handling implementation
