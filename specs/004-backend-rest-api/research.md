# Research: Backend REST API Layer

**Feature**: 004-backend-rest-api
**Phase**: 2.2
**Date**: 2026-01-02

## Research Summary

Phase 2.2 introduces minimal new technology - it primarily wires FastAPI routes to existing Phase 2.1 CRUD functions. Research focused on integration patterns and gap analysis.

---

## Decision 1: User Context Mechanism

**Question**: How should user_id be passed to endpoints before authentication is implemented?

**Decision**: Use `X-User-ID` HTTP header

**Rationale**:
- Header-based approach keeps user context separate from request body/query
- `X-` prefix indicates custom header (temporary, pre-auth)
- Easy to replace with JWT extraction in Phase 2.3
- Cleaner than query parameters for all endpoints

**Alternatives Considered**:
- Query parameter (`?user_id=xxx`) - Rejected: Pollutes URLs, not RESTful for all methods
- Path parameter (`/users/{user_id}/tasks`) - Rejected: Over-engineers for temporary solution
- Cookie - Rejected: Adds complexity, not needed for API

---

## Decision 2: Error Response for User Mismatch

**Question**: What status code when user tries to access another user's task?

**Decision**: Return 404 (Not Found), same as non-existent task

**Rationale**:
- Prevents information leakage (attacker can't probe for valid task IDs)
- Consistent with spec FR-012, FR-016, FR-019: "return 404 if task does not exist OR belongs to different user"
- Simpler error handling in routes

**Alternatives Considered**:
- 403 Forbidden - Rejected: Leaks information that task exists
- 401 Unauthorized - Rejected: Implies auth failure, not applicable in Phase 2.2

---

## Decision 3: CRUD Layer Gap - Completed Field Update

**Question**: Phase 2.1 `update_task()` doesn't support `completed` parameter. How to handle FR-014?

**Decision**: Extend `update_task()` function to accept optional `completed` parameter

**Rationale**:
- Non-breaking change (new optional parameter)
- Keeps all update logic in one function
- Avoids complex conditional logic in route handler
- `toggle_complete()` serves different use case (toggle only)

**Alternatives Considered**:
- Use `toggle_complete()` when completed changes - Rejected: Toggle can't set to specific value
- Combine update + toggle in route - Rejected: Complex, violates single responsibility
- Ignore completed in PUT, require PATCH only - Rejected: Violates FR-014

---

## Decision 4: API Router Organization

**Question**: How to organize FastAPI routes?

**Decision**: Single router in `routers/tasks.py` with `/api/tasks` prefix

**Rationale**:
- All 6 endpoints are task-related
- Single router is appropriate for single resource
- Prefix applied at router level, not per-route
- Easy to mount in main app

**Alternatives Considered**:
- Multiple routers per operation - Rejected: Over-engineering for 6 endpoints
- Flat routes in main.py - Rejected: Poor organization for growth

---

## Decision 5: Pydantic Model Location

**Question**: Where to define request/response Pydantic models?

**Decision**: Separate `schemas/` directory with `task.py`

**Rationale**:
- Clean separation from SQLModel models (data layer)
- Follows FastAPI conventions
- Enables different validation for API vs database
- Easy to extend for other resources later

**Alternatives Considered**:
- Same file as SQLModel models - Rejected: Mixes concerns
- Inline in router - Rejected: Poor reusability

---

## Decision 6: Database Error Handling

**Question**: How to handle database exceptions in routes?

**Decision**: Catch database exceptions in routes, return 503 with generic message

**Rationale**:
- Spec FR-025: "MUST NOT expose internal exception details"
- 503 indicates temporary unavailability
- Logging can capture details for debugging

**Alternatives Considered**:
- Let exceptions propagate - Rejected: Exposes internal details
- Custom exception handler - Rejected: Over-engineering for Phase 2.2

---

## Technology Stack Verification

| Component | Version/Status | Notes |
|-----------|----------------|-------|
| FastAPI | To be added | Not yet in requirements |
| Pydantic | Available via SQLModel | Already installed |
| uvicorn | To be added | ASGI server for running |
| httpx | To be added | For test client |
| pytest | To be verified | Should exist from Phase 2.1 |

---

## Phase 2.1 CRUD Function Analysis

### Functions Available

| Function | Suitable for API? | Notes |
|----------|-------------------|-------|
| `create_task(title, user_id, description)` | Yes | Direct mapping to POST |
| `get_task(task_id, user_id)` | Yes | Direct mapping to GET single |
| `get_tasks(user_id)` | Yes | Direct mapping to GET list |
| `update_task(task_id, user_id, title, description)` | Needs extension | Missing `completed` param |
| `delete_task(task_id, user_id)` | Yes | Returns bool, map to 204/404 |
| `toggle_complete(task_id, user_id)` | Yes | Direct mapping to PATCH |

### Required Modification

```python
# Current signature (Phase 2.1)
def update_task(task_id, user_id, title=None, description=None) -> Task | None

# Extended signature (Phase 2.2)
def update_task(task_id, user_id, title=None, description=None, completed=None) -> Task | None
```

This is a backward-compatible change - all existing calls continue to work.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CRUD modification breaks Phase 2.1 | Medium | Add completed param as optional with default None |
| X-User-ID header conflicts with future auth | Low | Documented as temporary, easy to deprecate |
| Database errors expose internals | Medium | Catch exceptions, return 503 with generic message |

---

## Research Complete

All unknowns resolved. Ready for Phase 1: Design & Contracts.
