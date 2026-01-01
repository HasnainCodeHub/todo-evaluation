# Data Model: Backend REST API Layer

**Feature**: 004-backend-rest-api
**Phase**: 2.2
**Date**: 2026-01-02

## Overview

Phase 2.2 introduces **API-layer Pydantic models** for request validation and response serialization. The database model (SQLModel `Task`) remains unchanged from Phase 2.1.

---

## Entity: TaskCreateRequest

**Purpose**: Validate incoming data for task creation (POST /api/tasks)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `title` | string | Yes | min_length=1, max_length=200 | Task title |
| `description` | string | No | max_length=1000 | Optional task description |

**Notes**:
- `user_id` is extracted from `X-User-ID` header, not request body
- `completed` defaults to `false` on creation (handled by CRUD layer)
- `id`, `created_at`, `updated_at` are auto-generated

---

## Entity: TaskUpdateRequest

**Purpose**: Validate incoming data for task updates (PUT /api/tasks/{id})

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `title` | string | No | min_length=1, max_length=200 | New title (if provided) |
| `description` | string | No | max_length=1000 | New description (if provided) |
| `completed` | boolean | No | N/A | New completion status (if provided) |

**Notes**:
- Partial update semantics: only provided fields are updated
- If no fields provided, request is valid but no changes occur
- `updated_at` is automatically updated by CRUD layer

---

## Entity: TaskResponse

**Purpose**: Serialize task data for API responses

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | integer | No | Unique task identifier |
| `user_id` | string | No | Owner identifier |
| `title` | string | No | Task title |
| `description` | string | Yes | Task description |
| `completed` | boolean | No | Completion status |
| `created_at` | datetime | No | Creation timestamp (UTC) |
| `updated_at` | datetime | No | Last update timestamp (UTC) |

**Notes**:
- Uses `model_config = ConfigDict(from_attributes=True)` for SQLModel compatibility
- Timestamps serialized as ISO 8601 strings

---

## Entity: ErrorResponse

**Purpose**: Standardized error response format

| Field | Type | Description |
|-------|------|-------------|
| `detail` | string | Human-readable error message |

**Notes**:
- Follows FastAPI's default error format
- Used for 400, 404, 503 responses
- 422 validation errors use FastAPI's auto-generated format

---

## Relationship to Phase 2.1 Database Model

```
┌─────────────────────┐       ┌──────────────────────┐
│   API Layer         │       │   Database Layer     │
│   (Pydantic)        │       │   (SQLModel)         │
├─────────────────────┤       ├──────────────────────┤
│ TaskCreateRequest   │──────>│ Task                 │
│ TaskUpdateRequest   │──────>│   (table=True)       │
│                     │       │                      │
│ TaskResponse       <│───────│ Task                 │
└─────────────────────┘       └──────────────────────┘
        │                              │
        │ X-User-ID header             │ user_id field
        └──────────────────────────────┘
```

---

## Validation Rules

### Title Validation
- Required for creation
- Optional for update
- Minimum 1 character (non-empty)
- Maximum 200 characters
- Whitespace-only rejected (implicit via min_length=1 after strip)

### Description Validation
- Optional for both create and update
- Maximum 1000 characters
- Can be null/None

### Completed Validation
- Boolean only (not truthy/falsy strings)
- Optional for update only
- Always `false` on creation

### User ID Validation
- Required via `X-User-ID` header
- Non-empty string
- Whitespace-trimmed
- No format validation (trusted input for Phase 2.2)

---

## State Transitions

```
┌─────────────┐         POST /api/tasks          ┌─────────────┐
│  No Task    │ ────────────────────────────────>│   Created   │
│             │                                   │ completed=F │
└─────────────┘                                   └──────┬──────┘
                                                         │
                    ┌────────────────────────────────────┤
                    │                                    │
                    ▼                                    ▼
            PUT (completed=true)               PATCH /complete
                    │                                    │
                    ▼                                    ▼
            ┌─────────────┐                     ┌─────────────┐
            │  Completed  │<───────────────────>│  Completed  │
            │ completed=T │     PATCH toggle    │ completed=T │
            └──────┬──────┘                     └──────┬──────┘
                   │                                   │
                   ▼                                   ▼
           DELETE /api/tasks/{id}              DELETE /api/tasks/{id}
                   │                                   │
                   ▼                                   ▼
            ┌─────────────┐                     ┌─────────────┐
            │   Deleted   │                     │   Deleted   │
            └─────────────┘                     └─────────────┘
```

---

## Model Implementation (Pydantic)

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    """Request model for creating a task."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)


class TaskUpdate(BaseModel):
    """Request model for updating a task."""
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    completed: bool | None = None


class TaskResponse(BaseModel):
    """Response model for task data."""
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```
