# Implementation Plan: Backend REST API Layer

**Branch**: `004-backend-rest-api` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-backend-rest-api/spec.md`
**Phase**: 2.2

## Summary

Expose Phase 2.1 database persistence layer through a RESTful FastAPI API with 6 task endpoints (create, list, get, update, delete, toggle). User scoping via `X-User-ID` header provides logical isolation without authentication (deferred to Phase 2.3). API delegates all persistence to existing CRUD functions.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: FastAPI, Pydantic (via SQLModel), uvicorn
**Storage**: Neon Serverless PostgreSQL (via Phase 2.1 database layer)
**Testing**: pytest with httpx (FastAPI TestClient)
**Target Platform**: Linux server / Windows development
**Project Type**: Web application (backend component)
**Performance Goals**: <500ms API response time for CRUD operations
**Constraints**: No authentication, no frontend integration, no direct SQL
**Scale/Scope**: Single backend service, 6 endpoints, 3 Pydantic models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| Spec-Driven Development | PASS | Spec exists at `/specs/004-backend-rest-api/spec.md` |
| Phase Discipline | PASS | Phase 2.2 builds on Phase 2.1, follows sequence |
| Technology Stack | PASS | FastAPI + Pydantic allowed in Phase II |
| No Premature Features | PASS | No auth, no frontend, no advanced features |
| Spec-Kit Authority | PASS | All requirements from approved spec |
| No Vibe Coding | PASS | All endpoints map to FR-xxx requirements |

### Phase II Technology Compliance

| Constraint | Requirement | Compliance |
|------------|-------------|------------|
| Backend Framework | FastAPI | COMPLIANT |
| ORM | SQLModel | COMPLIANT (Phase 2.1) |
| Database | Neon PostgreSQL | COMPLIANT (Phase 2.1) |
| Authentication | Better Auth + JWT | DEFERRED to Phase 2.3 |
| API Style | RESTful | COMPLIANT |

## Project Structure

### Documentation (this feature)

```text
specs/004-backend-rest-api/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py          # Package init
│   ├── main.py              # FastAPI application entry (NEW)
│   ├── config.py            # Environment configuration (existing)
│   ├── database.py          # Database connection (existing)
│   ├── models/              # SQLModel models (existing)
│   │   ├── __init__.py
│   │   └── task.py
│   ├── crud/                # Data access functions (existing)
│   │   ├── __init__.py
│   │   └── task.py
│   ├── routers/             # API route handlers (NEW)
│   │   ├── __init__.py
│   │   └── tasks.py
│   ├── schemas/             # Pydantic request/response models (NEW)
│   │   ├── __init__.py
│   │   └── task.py
│   └── dependencies/        # FastAPI dependencies (NEW)
│       ├── __init__.py
│       └── user.py
└── tests/                   # Test files (NEW)
    ├── __init__.py
    ├── conftest.py
    └── test_tasks_api.py
```

**Structure Decision**: Web application structure with separate `routers/`, `schemas/`, and `dependencies/` directories. Extends existing Phase 2.1 structure (models/, crud/, config.py, database.py).

## Complexity Tracking

No constitution violations requiring justification. Implementation follows minimal viable approach.

## Phase 2.1 Data Access Integration

### Available CRUD Functions (from `backend/app/crud/task.py`)

| Function | Signature | Returns | Notes |
|----------|-----------|---------|-------|
| `create_task` | `(title, user_id, description=None)` | `Task` | Creates with auto-ID, timestamps |
| `get_task` | `(task_id, user_id=None)` | `Task \| None` | Filters by user if provided |
| `get_tasks` | `(user_id=None)` | `list[Task]` | Ordered by created_at desc |
| `update_task` | `(task_id, user_id, title=None, description=None)` | `Task \| None` | Partial update, updates timestamp |
| `delete_task` | `(task_id, user_id)` | `bool` | True if deleted |
| `toggle_complete` | `(task_id, user_id)` | `Task \| None` | Flips completed status |

### Gap Analysis

| Spec Requirement | CRUD Support | Action |
|------------------|--------------|--------|
| FR-014: Update completed via PUT | `update_task` lacks `completed` param | Extend `update_task` OR use `toggle_complete` for bool changes |
| FR-015: Partial update | Supported | OK |
| FR-036: Response with all fields | Task model has all fields | OK |

**Resolution**: The `update_task` function needs to be extended to support `completed` parameter for FR-014 compliance. This is a non-breaking addition to Phase 2.1.

## API Layer Design

### Endpoint Mapping

| Endpoint | Method | Route | Handler | CRUD Function |
|----------|--------|-------|---------|---------------|
| Create Task | POST | `/api/tasks` | `create_task_endpoint` | `crud.create_task` |
| List Tasks | GET | `/api/tasks` | `list_tasks_endpoint` | `crud.get_tasks` |
| Get Task | GET | `/api/tasks/{task_id}` | `get_task_endpoint` | `crud.get_task` |
| Update Task | PUT | `/api/tasks/{task_id}` | `update_task_endpoint` | `crud.update_task` |
| Delete Task | DELETE | `/api/tasks/{task_id}` | `delete_task_endpoint` | `crud.delete_task` |
| Toggle Complete | PATCH | `/api/tasks/{task_id}/complete` | `toggle_task_endpoint` | `crud.toggle_complete` |

### User Context Handling

```python
# Dependency: Extract user_id from X-User-ID header
def get_user_id(x_user_id: str = Header(...)) -> str:
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(status_code=400, detail="X-User-ID header is required")
    return x_user_id.strip()
```

### Error Mapping

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| Missing X-User-ID | 400 | `{"detail": "X-User-ID header is required"}` |
| Task not found | 404 | `{"detail": "Task not found"}` |
| User mismatch | 404 | `{"detail": "Task not found"}` (same as not found) |
| Validation error | 422 | FastAPI auto-generated |
| Database error | 503 | `{"detail": "Service temporarily unavailable"}` |

### Pydantic Models

```python
# Request: Create task
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)

# Request: Update task
class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    completed: bool | None = None

# Response: Task
class TaskResponse(BaseModel):
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Implementation Order

1. **Schemas** (`schemas/task.py`) - Define Pydantic models
2. **Dependencies** (`dependencies/user.py`) - User ID extraction
3. **Router** (`routers/tasks.py`) - Route handlers calling CRUD
4. **Main Application** (`main.py`) - FastAPI app with router mounting
5. **CRUD Extension** - Add `completed` param to `update_task`
6. **Tests** - API endpoint tests

## Quality Gates (Phase 2.2 Completion)

Before declaring Phase 2.2 complete:

- [ ] All 6 endpoints return correct responses
- [ ] API delegates to Phase 2.1 CRUD functions (no SQL in routes)
- [ ] User scoping enforced via X-User-ID header
- [ ] Error handling returns appropriate status codes
- [ ] No authentication middleware exists
- [ ] Tests pass for all endpoints
- [ ] uvicorn can start the application

## Dependencies for Implementation

- **FastAPI**: Web framework (add to requirements)
- **uvicorn**: ASGI server (add to requirements)
- **httpx**: Test client for FastAPI (add to requirements)
- **pytest**: Test runner (likely already present)

## Next Phase Authorization

Successful completion of Phase 2.2 authorizes:
**Phase 2.3 — Authentication Integration (Better Auth + JWT)**
