# Tasks: Backend REST API Layer

**Feature**: 004-backend-rest-api
**Phase**: 2.2
**Input**: Design documents from `/specs/004-backend-rest-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Not explicitly requested in specification. Tests omitted per task generation rules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (backend)**: `backend/app/` for source, `backend/tests/` for tests
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create directory structure for API layer

- [ ] T001 Install FastAPI, uvicorn, httpx dependencies via `uv add fastapi uvicorn httpx`
- [ ] T002 [P] Create routers package directory with `backend/app/routers/__init__.py`
- [ ] T003 [P] Create schemas package directory with `backend/app/schemas/__init__.py`
- [ ] T004 [P] Create dependencies package directory with `backend/app/dependencies/__init__.py`

**Checkpoint**: Directory structure ready for API implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Define TaskCreate Pydantic model in `backend/app/schemas/task.py` per data-model.md (title required, description optional)
- [ ] T006 Define TaskUpdate Pydantic model in `backend/app/schemas/task.py` per data-model.md (all fields optional, includes completed)
- [ ] T007 Define TaskResponse Pydantic model in `backend/app/schemas/task.py` per data-model.md (all 7 fields, ConfigDict from_attributes=True)
- [ ] T008 Export all schemas from `backend/app/schemas/__init__.py`
- [ ] T009 Implement get_user_id dependency in `backend/app/dependencies/user.py` (extract X-User-ID header, return 400 if missing/empty)
- [ ] T010 Export get_user_id from `backend/app/dependencies/__init__.py`
- [ ] T011 Create empty tasks router in `backend/app/routers/tasks.py` with APIRouter and `/api/tasks` prefix
- [ ] T012 Export tasks router from `backend/app/routers/__init__.py`
- [ ] T013 Create FastAPI application in `backend/app/main.py` with tasks router mounted
- [ ] T014 Extend update_task CRUD function in `backend/app/crud/task.py` to accept optional `completed` parameter (non-breaking change)

**Checkpoint**: Foundation ready - all Pydantic models, dependencies, and router structure in place. User story implementation can now begin.

---

## Phase 3: User Story 1 - Create Task via API (Priority: P1)

**Goal**: API consumer can create tasks through POST /api/tasks endpoint

**Independent Test**: Send POST request with title and X-User-ID header, verify 201 response with complete task object

### Implementation for User Story 1

- [ ] T015 [US1] Implement POST /api/tasks endpoint in `backend/app/routers/tasks.py` - calls crud.create_task, returns TaskResponse with 201 status
- [ ] T016 [US1] Add validation error handling for missing title (FastAPI auto-handles via Pydantic)
- [ ] T017 [US1] Add database error handling with 503 response for create endpoint

**Checkpoint**: Create task endpoint functional - can create tasks via API

---

## Phase 4: User Story 2 - List Tasks via API (Priority: P1)

**Goal**: API consumer can retrieve all tasks for a user through GET /api/tasks endpoint

**Independent Test**: Create multiple tasks, call GET with X-User-ID, verify array of all user's tasks returned

### Implementation for User Story 2

- [ ] T018 [US2] Implement GET /api/tasks endpoint in `backend/app/routers/tasks.py` - calls crud.get_tasks with user_id, returns list[TaskResponse]
- [ ] T019 [US2] Add database error handling with 503 response for list endpoint

**Checkpoint**: List tasks endpoint functional - can view all user's tasks

---

## Phase 5: User Story 3 - Retrieve Single Task via API (Priority: P1)

**Goal**: API consumer can retrieve a specific task by ID through GET /api/tasks/{task_id} endpoint

**Independent Test**: Create task, call GET with task_id and X-User-ID, verify complete task returned; verify 404 for non-existent or other user's task

### Implementation for User Story 3

- [ ] T020 [US3] Implement GET /api/tasks/{task_id} endpoint in `backend/app/routers/tasks.py` - calls crud.get_task with user_id filter
- [ ] T021 [US3] Add 404 error handling when task not found or belongs to different user
- [ ] T022 [US3] Add database error handling with 503 response for get endpoint

**Checkpoint**: Get single task endpoint functional - can retrieve specific task details

---

## Phase 6: User Story 4 - Update Task via API (Priority: P1)

**Goal**: API consumer can update task properties through PUT /api/tasks/{task_id} endpoint

**Independent Test**: Create task, call PUT with partial update, verify only provided fields changed and updated_at reflects change

### Implementation for User Story 4

- [ ] T023 [US4] Implement PUT /api/tasks/{task_id} endpoint in `backend/app/routers/tasks.py` - calls extended crud.update_task with completed param support
- [ ] T024 [US4] Add 404 error handling when task not found or belongs to different user
- [ ] T025 [US4] Add database error handling with 503 response for update endpoint

**Checkpoint**: Update task endpoint functional - can modify task properties

---

## Phase 7: User Story 5 - Delete Task via API (Priority: P1)

**Goal**: API consumer can delete tasks through DELETE /api/tasks/{task_id} endpoint

**Independent Test**: Create task, call DELETE, verify 204 response; verify subsequent GET returns 404

### Implementation for User Story 5

- [ ] T026 [US5] Implement DELETE /api/tasks/{task_id} endpoint in `backend/app/routers/tasks.py` - calls crud.delete_task, returns 204 No Content
- [ ] T027 [US5] Add 404 error handling when task not found or belongs to different user
- [ ] T028 [US5] Add database error handling with 503 response for delete endpoint

**Checkpoint**: Delete task endpoint functional - can remove tasks

---

## Phase 8: User Story 6 - Toggle Task Completion via API (Priority: P2)

**Goal**: API consumer can toggle task completion status through PATCH /api/tasks/{task_id}/complete endpoint

**Independent Test**: Create incomplete task, call PATCH complete, verify completed=true; call again, verify completed=false

### Implementation for User Story 6

- [ ] T029 [US6] Implement PATCH /api/tasks/{task_id}/complete endpoint in `backend/app/routers/tasks.py` - calls crud.toggle_complete
- [ ] T030 [US6] Add 404 error handling when task not found or belongs to different user
- [ ] T031 [US6] Add database error handling with 503 response for toggle endpoint

**Checkpoint**: Toggle completion endpoint functional - all CRUD operations complete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validation, error handling consistency, and startup verification

- [ ] T032 Add database exception handler in `backend/app/main.py` to catch SQLAlchemy errors and return 503
- [ ] T033 Verify all endpoints return proper JSON content-type header
- [ ] T034 Test application startup with `uvicorn backend.app.main:app --reload`
- [ ] T035 Verify OpenAPI docs at /docs match contracts/openapi.yaml
- [ ] T036 Run manual validation per quickstart.md (create, list, get, update, delete, toggle)

**Checkpoint**: Phase 2.2 complete - all 6 endpoints functional with proper error handling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1-US5 (P1): Can proceed in priority order
  - US6 (P2): Can start after Foundational, but logically follows US1-US5
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

All user stories depend only on Foundational phase (Phase 2), not on each other:

- **User Story 1 (Create)**: Independent - can test with just create endpoint
- **User Story 2 (List)**: Independent - needs tasks to exist (use create first for testing)
- **User Story 3 (Get)**: Independent - needs task to exist
- **User Story 4 (Update)**: Independent - needs task to exist
- **User Story 5 (Delete)**: Independent - needs task to exist
- **User Story 6 (Toggle)**: Independent - needs task to exist

### Within Each User Story

1. Implement core endpoint
2. Add 404 error handling
3. Add 503 database error handling
4. Verify at checkpoint

### Parallel Opportunities

**Phase 1 (Setup):**
```
T002 + T003 + T004 (all create package directories - different files)
```

**Phase 2 (Foundational):**
```
T005 + T006 + T007 (all in same file but different classes - sequential)
T009 + T011 (different files - parallel)
```

**After Foundational - User Stories can run in parallel with multiple developers:**
```
Developer A: US1 (T015-T017) → US4 (T023-T025)
Developer B: US2 (T018-T019) → US5 (T026-T028)
Developer C: US3 (T020-T022) → US6 (T029-T031)
```

---

## Parallel Example: Setup Phase

```bash
# Launch all package directory creation tasks together:
Task: "Create routers package in backend/app/routers/__init__.py"
Task: "Create schemas package in backend/app/schemas/__init__.py"
Task: "Create dependencies package in backend/app/dependencies/__init__.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T014)
3. Complete Phase 3: User Story 1 - Create (T015-T017)
4. **STOP and VALIDATE**: Test create endpoint with curl/httpie
5. Can demo task creation capability

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Create) → Can create tasks (minimal API)
3. Add US2 (List) → Can create and list tasks
4. Add US3 (Get) → Full read capability
5. Add US4 (Update) → Can modify tasks
6. Add US5 (Delete) → Full CRUD complete
7. Add US6 (Toggle) → Convenience feature added
8. Polish → Production-ready API

---

## Task Summary

| Phase | Tasks | Files Modified |
|-------|-------|----------------|
| Setup | 4 | Package directories |
| Foundational | 10 | schemas/task.py, dependencies/user.py, routers/tasks.py, main.py, crud/task.py |
| US1: Create | 3 | routers/tasks.py |
| US2: List | 2 | routers/tasks.py |
| US3: Get | 3 | routers/tasks.py |
| US4: Update | 3 | routers/tasks.py |
| US5: Delete | 3 | routers/tasks.py |
| US6: Toggle | 3 | routers/tasks.py |
| Polish | 5 | main.py, verification |
| **Total** | **36** | |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] labels (US1-US6) map to spec.md user stories
- Each user story can be tested independently after Foundational phase
- Commit after each task or checkpoint
- All endpoints share same router file - work sequentially within a story
- No tests generated (not requested in specification)
- Phase 2.2 scope: API layer only - no auth, no frontend, no direct SQL
