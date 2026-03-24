---
id: "0007"
title: show-task-ids-for-chat-commands
stage: green
date: 2026-03-25
surface: agent
model: gpt-5
feature: 010-chatbot-ui
branch: 001-cli-task-crud
user: Hasnain Ali
command: /sp.phr
labels: [green, chatbot, tasks, ui, task-id]
links:
  spec: specs/010-chatbot-ui/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/010-chatbot-ui/spec.md
  - specs/010-chatbot-ui/plan.md
  - specs/010-chatbot-ui/tasks.md
  - frontend/components/tasks/TaskItem.tsx
  - frontend/components/chat/ChatPanel.tsx
tests:
  - cmd /c npm run build (frontend)
---

## Prompt

User requested showing task IDs so users can perform precise chatbot operations by referencing IDs.

## Response snapshot

Added task ID visibility directly in dashboard task cards and included chatbot guidance text for ID-based commands. Updated spec/plan/tasks artifacts for 010-chatbot-ui and validated with a passing frontend build.

## Outcome

- Impact: Users can now see `#<id>` on each task and use those IDs in chatbot commands like update/complete/delete.
- Tests: Frontend build passed.
- Files: 5 updated + 1 PHR created.
- Next prompts: Manually verify chat commands against visible IDs in dashboard.
- Reflection: Small UI affordances (visible IDs) materially improve reliability of natural-language task targeting.

## Evaluation notes (flywheel)

- Failure modes observed: First build attempt hit a transient Next page-data cache error (`/_not-found`); resolved by clearing `.next`.
- Graders run and results (PASS/FAIL): `npm run build` PASS after cache cleanup.
- Prompt variant (if applicable): None.
- Next experiment (smallest change to try): Add E2E check for "visible ID used in chatbot command" flow.
