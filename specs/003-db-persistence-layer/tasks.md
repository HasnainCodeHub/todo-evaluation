# Tasks: Database Persistence Layer (Phase 2.1)

**Input**: Design documents from `/specs/003-db-persistence-layer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Phase**: 2.1 — Database-Only (No API, No Auth, No Frontend)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` for all Phase 2.1 code
- **Phase I code**: `src/` remains UNCHANGED

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create backend directory structure and install dependencies

**Agent**: database-modeling-agent
**Skills**: neon-postgres-integration, sqlmodel-design

- [ ] T001 Validate Phase 2.1 scope constraints per spec.md (FR-013 to FR-017)
- [ ] T002 Create backend/app directory structure with __init__.py files
- [ ] T003 [P] Add SQLModel dependencies to pyproject.toml (sqlmodel, psycopg2-binary, python-dotenv)
- [ ] T004 [P] Create .env.example with DATABASE_URL template in project root

---

## Phase 2: Foundational (Database Infrastructure)

**Purpose**: Core database infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Agent**: database-modeling-agent
**Skills**: neon-postgres-integration, sqlmodel-design

- [ ] T005 Implement config.py with Settings class in backend/app/config.py
- [ ] T006 Implement database engine creation in backend/app/database.py
- [ ] T007 Implement get_session context manager in backend/app/database.py
- [ ] T008 Implement init_db function for table creation in backend/app/database.py

**Checkpoint**: Database infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Task Persistence Across Sessions (Priority: P1) 🎯 MVP

**Goal**: Tasks persist in PostgreSQL and survive application restarts

**Independent Test**: Create task → restart application → verify task is retrievable

**Agent**: database-modeling-agent
**Skills**: sqlmodel-design, relational-data-modeling

### Implementation for User Story 1

- [ ] T009 [US1] Create Task SQLModel entity in backend/app/models/__init__.py
- [ ] T010 [US1] Define Task model with id, title, description, completed fields in backend/app/models/task.py
- [ ] T011 [US1] Add created_at and updated_at timestamp fields in backend/app/models/task.py
- [ ] T012 [US1] Add user_id field with index in backend/app/models/task.py
- [ ] T013 [US1] Export Task model from backend/app/models/__init__.py

**Checkpoint**: Task entity complete with all fields per FR-001

---

## Phase 4: User Story 2 - User-Scoped Task Ownership (Priority: P1)

**Goal**: Tasks are associated with user_id for future multi-user isolation

**Independent Test**: Create tasks with different user_ids → query by user_id → verify isolation

**Agent**: database-modeling-agent
**Skills**: relational-data-modeling, constraint-enforcement

### Implementation for User Story 2

- [ ] T014 [US2] Create CRUD module structure in backend/app/crud/__init__.py
- [ ] T015 [US2] Implement create_task function with user_id in backend/app/crud/task.py
- [ ] T016 [US2] Implement get_tasks function with optional user_id filter in backend/app/crud/task.py
- [ ] T017 [US2] Implement get_task function (by ID) in backend/app/crud/task.py

**Checkpoint**: User-scoped task creation and retrieval working

---

## Phase 5: User Story 3 - CRUD Operations at Data Access Layer (Priority: P1)

**Goal**: Complete CRUD operations for task management

**Independent Test**: Execute create, read, update, delete, toggle operations → verify database state

**Agent**: database-modeling-agent
**Skills**: relational-data-modeling, constraint-enforcement

### Implementation for User Story 3

- [ ] T018 [US3] Implement update_task function in backend/app/crud/task.py
- [ ] T019 [US3] Implement delete_task function in backend/app/crud/task.py
- [ ] T020 [US3] Implement toggle_complete function in backend/app/crud/task.py
- [ ] T021 [US3] Export all CRUD functions from backend/app/crud/__init__.py

**Checkpoint**: All 6 CRUD operations (FR-004 to FR-009) implemented

---

## Phase 6: User Story 4 - Database Connection Management (Priority: P2)

**Goal**: Reliable connection handling with proper error messages

**Independent Test**: Connect with valid credentials → verify success; connect with invalid → verify error handling

**Agent**: database-modeling-agent
**Skills**: neon-postgres-integration, constraint-enforcement

### Implementation for User Story 4

- [ ] T022 [US4] Add connection error handling in backend/app/database.py
- [ ] T023 [US4] Verify SSL mode configuration for Neon in backend/app/database.py
- [ ] T024 [US4] Add session cleanup in context manager in backend/app/database.py

**Checkpoint**: Connection management robust with proper error handling

---

## Phase 7: Validation & Completion

**Purpose**: Verify Phase 2.1 requirements and authorize Phase 2.2

**Agent**: phase-orchestrator
**Skills**: constraint-enforcement, spec-interpretation

- [ ] T025 Verify no REST API endpoints in codebase (FR-013)
- [ ] T026 Verify no JWT/auth code in codebase (FR-014)
- [ ] T027 Verify no frontend code created (FR-015)
- [ ] T028 Verify no raw SQL queries used (FR-016)
- [ ] T029 Verify Phase I src/ directory unchanged
- [ ] T030 Execute quickstart.md verification steps
- [ ] T031 Document Phase 2.1 completion and authorize Phase 2.2

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - Task model
- **US2 (Phase 4)**: Depends on US1 - user_id filtering
- **US3 (Phase 5)**: Depends on US2 - complete CRUD
- **US4 (Phase 6)**: Can run in parallel with US2/US3 (different files)
- **Validation (Phase 7)**: Depends on all user stories

### User Story Dependencies

```
Setup (Phase 1)
    ↓
Foundational (Phase 2) ← BLOCKS ALL
    ↓
US1: Task Model (Phase 3)
    ↓
US2: User Scoping (Phase 4) ←──┐
    ↓                          │ Can parallel
US3: Full CRUD (Phase 5)       │
                               │
US4: Connection Mgmt (Phase 6) ┘
    ↓
Validation (Phase 7)
```

### Parallel Opportunities

Within Phase 1:
- T003 and T004 can run in parallel (different files)

Within User Stories:
- US4 (Connection Management) can run in parallel with US2/US3 (different focus areas)

---

## Agent and Skill Mapping

| Phase | Agent | Skills |
|-------|-------|--------|
| Phase 1-2 | database-modeling-agent | neon-postgres-integration, sqlmodel-design |
| Phase 3 | database-modeling-agent | sqlmodel-design, relational-data-modeling |
| Phase 4-5 | database-modeling-agent | relational-data-modeling, constraint-enforcement |
| Phase 6 | database-modeling-agent | neon-postgres-integration, constraint-enforcement |
| Phase 7 | phase-orchestrator | constraint-enforcement, spec-interpretation |

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Task Model)
4. **VALIDATE**: Can create and retrieve tasks from database

### Incremental Delivery

1. Setup + Foundational → Database connected
2. US1 (Task Model) → Tasks persist in PostgreSQL
3. US2 (User Scoping) → user_id filtering works
4. US3 (Full CRUD) → All operations available
5. US4 (Connection Mgmt) → Robust error handling
6. Validation → Phase 2.1 complete, authorize Phase 2.2

---

## Scope Constraints (Enforced)

### MUST Include ✅
- SQLModel Task model with all fields from FR-001
- Database connection via DATABASE_URL
- Table creation function (idempotent)
- CRUD functions (FR-004 through FR-009)
- User-scoped queries via user_id

### MUST NOT Include ❌
- REST API endpoints (FR-013)
- JWT verification (FR-014)
- Frontend code (FR-015)
- Raw SQL queries (FR-016)
- Database migrations (FR-017)

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | T001-T004 | Project structure, dependencies |
| Phase 2: Foundational | T005-T008 | Database infrastructure |
| Phase 3: US1 | T009-T013 | Task model definition |
| Phase 4: US2 | T014-T017 | User-scoped operations |
| Phase 5: US3 | T018-T021 | Complete CRUD |
| Phase 6: US4 | T022-T024 | Connection management |
| Phase 7: Validation | T025-T031 | Phase completion |
| **Total** | **31 tasks** | |

---

## Notes

- All code goes in `backend/app/` - no changes to Phase I `src/`
- Tests are NOT included (Phase 2.2 scope)
- Verify each phase checkpoint before proceeding
- Stop and validate at any checkpoint if needed
- Commit after each task or logical group
