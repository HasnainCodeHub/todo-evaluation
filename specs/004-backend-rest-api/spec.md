# Feature Specification: Backend REST API Layer

**Feature Branch**: `004-backend-rest-api`
**Created**: 2026-01-02
**Status**: Draft
**Phase**: 2.2
**Input**: User description: "Phase 2.2 Backend REST API Layer - Expose database-backed task management functionality through a RESTful FastAPI API with user-scoped routing, delegating persistence to Phase 2.1 database layer, without authentication enforcement"

## Overview

Phase 2.2 introduces a RESTful HTTP API layer on top of the Phase 2.1 database persistence layer. This phase exposes task CRUD operations via FastAPI while deliberately deferring authentication enforcement to Phase 2.3. The API provides user-scoped task management through a temporary user_id mechanism that prepares the codebase for future JWT integration.

## Clarifications

### Session 2026-01-02

- Q: User identification mechanism (pre-auth)? → A: `X-User-Id` HTTP header, required on all requests, return 400 if missing
- Q: API path and versioning? → A: No versioning, base path `/api/tasks`
- Q: Task completion toggle behavior? → A: Toggle flips completed (false→true, true→false)
- Q: Update task behavior? → A: Partial updates - only provided fields are modified
- Q: Error response format? → A: Nested structure `{"error": {"code": "ERROR_CODE", "message": "Human-readable message"}}`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Task via API (Priority: P1)

As an API consumer, I need to create tasks through an HTTP endpoint so that applications can programmatically add tasks to the system.

**Why this priority**: Task creation is the foundational write operation. Without it, no tasks exist to read, update, or delete.

**Independent Test**: Can be fully tested by sending a POST request with task data and verifying the response contains a created task with an auto-generated ID.

**Acceptance Scenarios**:

1. **Given** a valid request with title "Buy groceries" and user_id header, **When** POST /api/tasks is called, **Then** a 201 response is returned with the created task including generated id, timestamps, and completed=false
2. **Given** a request with title and optional description, **When** POST /api/tasks is called, **Then** the task is created with both fields persisted
3. **Given** a request missing the required title field, **When** POST /api/tasks is called, **Then** a 422 response is returned with validation error details
4. **Given** a request missing user_id, **When** POST /api/tasks is called, **Then** a 400 response is returned indicating user_id is required

---

### User Story 2 - List Tasks via API (Priority: P1)

As an API consumer, I need to retrieve all tasks for a specific user so that applications can display task lists.

**Why this priority**: Reading tasks is the most frequent operation. Users need to see their tasks before performing any other action.

**Independent Test**: Can be fully tested by creating multiple tasks for a user, then calling GET /api/tasks and verifying all tasks are returned.

**Acceptance Scenarios**:

1. **Given** user "user-123" has 3 tasks, **When** GET /api/tasks is called with user_id "user-123", **Then** a 200 response is returned with an array of exactly 3 tasks
2. **Given** user "user-456" has no tasks, **When** GET /api/tasks is called with user_id "user-456", **Then** a 200 response is returned with an empty array
3. **Given** tasks exist for multiple users, **When** GET /api/tasks is called for one user, **Then** only that user's tasks are returned (user isolation)

---

### User Story 3 - Retrieve Single Task via API (Priority: P1)

As an API consumer, I need to retrieve a specific task by ID so that applications can display task details or verify task state.

**Why this priority**: Single-task retrieval enables detailed views and state verification, essential for update/delete workflows.

**Independent Test**: Can be fully tested by creating a task, then calling GET /api/tasks/{id} and verifying the complete task data is returned.

**Acceptance Scenarios**:

1. **Given** a task with ID 42 exists for user "user-123", **When** GET /api/tasks/42 is called with user_id "user-123", **Then** a 200 response is returned with the complete task object
2. **Given** no task with ID 999 exists, **When** GET /api/tasks/999 is called, **Then** a 404 response is returned with "Task not found" message
3. **Given** a task with ID 42 belongs to user "user-123", **When** GET /api/tasks/42 is called with user_id "user-456", **Then** a 404 response is returned (user cannot see other users' tasks)

---

### User Story 4 - Update Task via API (Priority: P1)

As an API consumer, I need to update task properties so that applications can modify task title, description, or completion status.

**Why this priority**: Task updates are core to task management workflows - marking progress, editing details.

**Independent Test**: Can be fully tested by creating a task, calling PUT with new values, and verifying the response reflects the changes.

**Acceptance Scenarios**:

1. **Given** a task with ID 42 and title "Old Title", **When** PUT /api/tasks/42 is called with title "New Title", **Then** a 200 response is returned with the updated task and updated_at reflects the change time
2. **Given** a task with ID 42, **When** PUT /api/tasks/42 is called with only description field, **Then** only description is updated, other fields remain unchanged
3. **Given** a task with ID 42 belongs to user "user-123", **When** PUT /api/tasks/42 is called with user_id "user-456", **Then** a 404 response is returned (user cannot update other users' tasks)
4. **Given** no task with ID 999 exists, **When** PUT /api/tasks/999 is called, **Then** a 404 response is returned

---

### User Story 5 - Delete Task via API (Priority: P1)

As an API consumer, I need to delete tasks so that applications can remove completed or unwanted tasks.

**Why this priority**: Deletion completes the CRUD lifecycle and enables task cleanup.

**Independent Test**: Can be fully tested by creating a task, calling DELETE, and verifying the task no longer exists.

**Acceptance Scenarios**:

1. **Given** a task with ID 42 exists for user "user-123", **When** DELETE /api/tasks/42 is called with user_id "user-123", **Then** a 204 response is returned and the task is removed from storage
2. **Given** no task with ID 999 exists, **When** DELETE /api/tasks/999 is called, **Then** a 404 response is returned
3. **Given** a task with ID 42 belongs to user "user-123", **When** DELETE /api/tasks/42 is called with user_id "user-456", **Then** a 404 response is returned (user cannot delete other users' tasks)

---

### User Story 6 - Toggle Task Completion via API (Priority: P2)

As an API consumer, I need a convenient endpoint to toggle task completion status so that applications can quickly mark tasks complete or incomplete.

**Why this priority**: While completion can be changed via PUT, a dedicated toggle endpoint simplifies common UI interactions.

**Independent Test**: Can be fully tested by creating an incomplete task, calling PATCH complete, verifying it becomes complete, then calling again to verify it toggles back.

**Acceptance Scenarios**:

1. **Given** a task with ID 42 has completed=false, **When** PATCH /api/tasks/42/complete is called, **Then** a 200 response is returned with the task showing completed=true
2. **Given** a task with ID 42 has completed=true, **When** PATCH /api/tasks/42/complete is called, **Then** a 200 response is returned with the task showing completed=false
3. **Given** a task with ID 42 belongs to user "user-123", **When** PATCH /api/tasks/42/complete is called with user_id "user-456", **Then** a 404 response is returned

---

### Edge Cases

- What happens when task_id in URL is not a valid integer? → Return 422 validation error
- What happens when request body contains unknown fields? → Ignore unknown fields (permissive parsing)
- What happens when title is empty string? → Return 422 validation error (title required and non-empty)
- What happens when user_id header is empty string? → Treat as missing, return 400 error
- What happens when database is unavailable? → Return 503 Service Unavailable with generic error message
- What happens when request body is malformed JSON? → Return 422 validation error

## Requirements *(mandatory)*

### Functional Requirements

**API Application Setup:**
- **FR-001**: System MUST expose a FastAPI application serving HTTP requests
- **FR-002**: System MUST serve all task endpoints under the `/api/tasks` base path
- **FR-003**: System MUST accept and return JSON as the content type

**User Context (Pre-Authentication):**
- **FR-004**: System MUST accept user_id via HTTP header `X-User-ID`
- **FR-005**: System MUST require user_id on all endpoints (return 400 if missing)
- **FR-006**: System MUST scope all task operations to the provided user_id

**Task Creation:**
- **FR-007**: System MUST expose POST /api/tasks to create a new task
- **FR-008**: Create request MUST accept title (required string) and description (optional string)
- **FR-009**: Create response MUST return the complete task object with generated id, user_id, timestamps, and completed=false

**Task Retrieval:**
- **FR-010**: System MUST expose GET /api/tasks to list all tasks for the authenticated user
- **FR-011**: System MUST expose GET /api/tasks/{task_id} to retrieve a single task
- **FR-012**: Single task retrieval MUST return 404 if task does not exist OR belongs to different user

**Task Update:**
- **FR-013**: System MUST expose PUT /api/tasks/{task_id} to update a task
- **FR-014**: Update request MUST accept optional title, description, and completed fields
- **FR-015**: Update MUST only modify provided fields (partial update semantics)
- **FR-016**: Update MUST return 404 if task does not exist OR belongs to different user

**Task Deletion:**
- **FR-017**: System MUST expose DELETE /api/tasks/{task_id} to remove a task
- **FR-018**: Delete MUST return 204 No Content on success
- **FR-019**: Delete MUST return 404 if task does not exist OR belongs to different user

**Task Completion Toggle:**
- **FR-020**: System MUST expose PATCH /api/tasks/{task_id}/complete to toggle completion status
- **FR-021**: Toggle MUST flip completed from true to false or false to true
- **FR-022**: Toggle MUST return the updated task object

**Error Handling:**
- **FR-023**: System MUST return standard HTTP status codes (200, 201, 204, 400, 404, 422, 500, 503)
- **FR-024**: System MUST return JSON error responses with a "detail" field
- **FR-025**: System MUST NOT expose internal exception details in error responses
- **FR-026**: System MUST return 400 for missing user_id
- **FR-027**: System MUST return 404 for resource not found (including user mismatch)
- **FR-028**: System MUST return 422 for validation errors (invalid input)

**Architecture Constraints:**
- **FR-029**: API routes MUST delegate all database operations to Phase 2.1 data access layer
- **FR-030**: API routes MUST NOT contain direct database queries or SQL
- **FR-031**: System MUST use FastAPI routers for endpoint organization
- **FR-032**: System MUST NOT include any authentication middleware or JWT verification
- **FR-033**: System MUST NOT modify Phase 2.1 database layer in breaking ways

**Request/Response Models:**
- **FR-034**: System MUST define Pydantic models for request validation
- **FR-035**: System MUST define Pydantic models for response serialization
- **FR-036**: Task response model MUST include: id, user_id, title, description, completed, created_at, updated_at

### Key Entities

- **TaskCreateRequest**: Incoming data for task creation. Contains title (required) and description (optional). Used for request validation.
- **TaskUpdateRequest**: Incoming data for task updates. Contains optional title, description, and completed. Supports partial updates.
- **TaskResponse**: Outgoing data for task representation. Contains all task fields including id, user_id, title, description, completed, created_at, updated_at.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 task operations (create, list, get, update, delete, toggle) are accessible via HTTP and return correct responses
- **SC-002**: API successfully delegates all persistence to Phase 2.1 database layer (zero SQL in route handlers)
- **SC-003**: User scoping is enforced on 100% of endpoints (user A cannot access user B's tasks)
- **SC-004**: All error scenarios return appropriate HTTP status codes and JSON error bodies
- **SC-005**: Zero authentication/authorization middleware exists in Phase 2.2 codebase
- **SC-006**: API response times are under 500ms for standard CRUD operations under normal load
- **SC-007**: API handles malformed requests gracefully without crashing

## Scope Boundaries

### In Scope
- FastAPI application setup and configuration
- REST API route definitions for all task operations
- Request and response Pydantic models
- HTTP error handling with standard status codes
- User-scoped routing via X-User-ID header
- Integration with Phase 2.1 data access functions

### Out of Scope
- JWT verification or token validation
- Better Auth integration
- Authentication middleware
- Frontend integration or UI code
- Advanced API features (pagination, search, sorting, filtering)
- Background jobs, events, or webhooks
- Rate limiting or API throttling
- API documentation generation (auto-generated by FastAPI is acceptable)

## Assumptions

- Phase 2.1 database layer is complete and functional with all CRUD operations available
- X-User-ID header mechanism is temporary and will be replaced by JWT in Phase 2.3
- User IDs are trusted as-provided (no validation of user existence)
- FastAPI and Pydantic are the chosen frameworks (per technology constraints)
- The backend/ directory structure from Phase 2.0/2.1 is in place
- No breaking changes to Phase 2.1 data access function signatures are needed

## Dependencies

- **Phase 2.1**: Database persistence layer must be complete (data access functions available)
- **Phase 2.0**: Repository structure must be in place (backend/ directory exists)
- **Libraries**: FastAPI, Pydantic (may already be included via SQLModel), uvicorn (for running)

## Next Phase

Completion of Phase 2.2 authorizes: **Phase 2.3 — Authentication Integration (Better Auth + JWT)**
