---
id: "0003"
title: Phase 2.0 Repository Governance Tasks
stage: tasks
date: 2026-01-01
surface: agent
model: claude-opus-4-5-20251101
feature: 002-repo-governance
branch: 002-repo-governance
user: HasnainCodeHub
command: /sp.tasks
labels: ["phase-2", "tasks", "governance", "monorepo", "agents", "skills"]
links:
  spec: specs/002-repo-governance/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-repo-governance/tasks.md
tests:
  - Task format validation: All 30 tasks follow checklist format
  - User story mapping: All tasks mapped to US1-US4 or setup/validation
  - Agent/skill assignment: All phases have assigned intelligence
---

## Prompt

/sp.tasks

Phase 2.0 Tasks — Repository & Governance Evolution

All tasks in this phase are GOVERNANCE-ONLY tasks.
No application logic, APIs, database code, authentication, or UI code is allowed.

Reusable intelligence (agents + skills) must be used as the primary execution mechanism.

Key tasks from user input:
- T-2.0-001: Validate Phase 2.0 Scope & Constraints
- T-2.0-002: Scaffold Spec Governance Structure
- T-2.0-003: Create Root CLAUDE.md
- T-2.0-004: Create Frontend CLAUDE.md
- T-2.0-005: Create Backend CLAUDE.md
- T-2.0-006: Validation gate check

Authorization: Completion authorizes Phase 2.1 — Database Persistence Layer

## Response snapshot

Generated tasks.md with 30 tasks across 6 phases, organized by 4 user stories. Tasks mapped to responsible agents (phase-orchestrator, monorepo-architect, requirements-ingestor) and skills (monorepo-architecture, spec-referencing, claude-context-design, constraint-enforcement, spec-interpretation).

## Outcome

- ✅ Impact: Complete task breakdown for Phase 2.0 - 30 governance-only tasks with agent/skill assignments
- 🧪 Tests: N/A - governance phase uses manual verification only
- 📁 Files: specs/002-repo-governance/tasks.md created
- 🔁 Next prompts: /sp.implement to execute all tasks
- 🧠 Reflection: User-provided task structure enabled quick task generation; agent/skill mapping ensures reusable intelligence is primary executor

## Evaluation notes (flywheel)

- Failure modes observed: None - clear task structure from user input
- Graders run and results (PASS/FAIL):
  - All tasks follow checklist format: PASS
  - Tasks organized by user story: PASS
  - Agent/skill assignments complete: PASS
  - Parallel opportunities identified: PASS
  - Task count matches scope: PASS (30 tasks for governance phase)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A - task generation successful
