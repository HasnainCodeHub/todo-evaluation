---
id: 0001
title: Phase 2.1 Database Persistence Spec
stage: spec
date: 2026-01-01
surface: agent
model: claude-opus-4-5-20251101
feature: 003-db-persistence-layer
branch: 003-db-persistence-layer
user: ESHOP
command: /sp.specify
labels: ["database", "persistence", "sqlmodel", "phase-2.1", "neon-postgres"]
links:
  spec: specs/003-db-persistence-layer/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-db-persistence-layer/spec.md
  - specs/003-db-persistence-layer/checklists/requirements.md
tests:
  - Specification quality checklist (16/16 PASS)
---

## Prompt

/sp.specify Phase 2.1 Specification — Database Persistence Layer

OVERVIEW
Phase 2.1 replaces the Phase I in-memory task storage with persistent storage using Neon Serverless PostgreSQL and SQLModel. This phase introduces database models, connections, and data access patterns only. No REST API, authentication enforcement, or frontend integration is permitted in this phase.

This specification applies ONLY to Phase 2.1.

────────────────────────────────────────
1. OBJECTIVE
────────────────────────────────────────

Introduce a persistent database layer that:
- Stores todo tasks in PostgreSQL
- Uses SQLModel as the ORM
- Enforces task ownership via user identifiers
- Supports CRUD operations at the data-access level
- Preserves Phase I behavior logically while replacing storage

────────────────────────────────────────
2. SCOPE
────────────────────────────────────────

IN SCOPE:
- SQLModel model definitions
- Database connection configuration
- Table creation logic
- Data-access functions for tasks
- User ownership fields (logical, not authenticated)

OUT OF SCOPE:
- REST API endpoints
- JWT verification
- Better Auth integration
- Frontend UI
- Database migrations (Alembic)
- Advanced features (tags, due dates, reminders)

4.2 User Handling
- Users are represented ONLY by user_id strings
- No users table is required in Phase 2.1
- user_id values are assumed valid (authentication comes later)

No API routers or HTTP logic may be introduced.
No manual SQL
- No business logic beyond CRUD

────────────────────────────────────────
9. ACCEPTANCE CRITERIA
────────────────────────────────────────

Phase 2.1 is complete when:
- Tasks are persisted in PostgreSQL
- All CRUD operations work at the data-access layer
- Task ownership is enforced by user_id filtering
- Phase I in-memory storage is fully replaced
- No API or UI code exists

────────────────────────────────────────
10. NEXT PHASE DEPENDENCY
────────────────────────────────────────

Completion of Phase 2.1 authorizes:
- Phase 2.2 — Backend REST API Layer

END OF SPECIFICATION

## Response snapshot

Created Phase 2.1 Database Persistence Layer specification with:

**Branch**: `003-db-persistence-layer`

**User Stories** (4 total):
1. Task Persistence Across Sessions (P1) - Data survives restarts
2. User-Scoped Task Ownership (P1) - user_id field for future isolation
3. CRUD Operations at Data Access Layer (P1) - Core data functions
4. Database Connection Management (P2) - Neon PostgreSQL connectivity

**Functional Requirements** (17 total):
- FR-001 to FR-003: Data Model (Task entity, SQLModel ORM, no users table)
- FR-004 to FR-009: Data Access (create, get, get_all, update, delete, toggle)
- FR-010 to FR-012: Database Connection (env vars, Neon support, init)
- FR-013 to FR-017: Constraints (no API, no auth, no frontend, no raw SQL, no migrations)

**Success Criteria** (7 total):
- SC-001 to SC-007: Data durability, CRUD success, user isolation, connection speed, Phase I parity, zero API/auth code

**Quality Checklist**: 16/16 items passed

## Outcome

- ✅ Impact: Phase 2.1 specification complete and validated
- 🧪 Tests: Quality checklist 16/16 PASS
- 📁 Files: 2 files created (spec.md, checklists/requirements.md)
- 🔁 Next prompts: /sp.plan to create implementation plan
- 🧠 Reflection: Clean specification with no clarifications needed - user input was comprehensive

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Quality checklist PASS (16/16)
- Prompt variant (if applicable): Standard /sp.specify with detailed user input
- Next experiment (smallest change to try): N/A - specification complete
