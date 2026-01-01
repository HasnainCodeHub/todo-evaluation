# Quickstart: Backend REST API Layer

**Feature**: 004-backend-rest-api
**Phase**: 2.2
**Date**: 2026-01-02

## Prerequisites

- Python 3.13+
- UV package manager
- Phase 2.1 database layer complete (models, CRUD, database connection)
- Neon PostgreSQL database configured with `DATABASE_URL`

## Setup

### 1. Install Dependencies

```bash
cd backend
uv add fastapi uvicorn httpx
```

### 2. Verify Environment

Ensure `.env` file exists with database URL:

```bash
# .env
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require
```

### 3. Run the API Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verify API is Running

```bash
curl http://localhost:8000/docs
```

FastAPI auto-generates interactive API documentation at `/docs`.

---

## Quick API Test

### Create a Task

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user-123" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

**Expected Response (201):**
```json
{
  "id": 1,
  "user_id": "user-123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2026-01-02T12:00:00Z",
  "updated_at": "2026-01-02T12:00:00Z"
}
```

### List Tasks

```bash
curl http://localhost:8000/api/tasks \
  -H "X-User-ID: user-123"
```

### Get Single Task

```bash
curl http://localhost:8000/api/tasks/1 \
  -H "X-User-ID: user-123"
```

### Update Task

```bash
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user-123" \
  -d '{"title": "Updated title", "completed": true}'
```

### Toggle Completion

```bash
curl -X PATCH http://localhost:8000/api/tasks/1/complete \
  -H "X-User-ID: user-123"
```

### Delete Task

```bash
curl -X DELETE http://localhost:8000/api/tasks/1 \
  -H "X-User-ID: user-123"
```

**Expected Response: 204 No Content**

---

## Running Tests

```bash
cd backend
pytest tests/test_tasks_api.py -v
```

---

## Project Structure After Phase 2.2

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application (NEW)
│   ├── config.py            # Environment configuration
│   ├── database.py          # Database connection
│   ├── models/              # SQLModel models
│   │   ├── __init__.py
│   │   └── task.py
│   ├── crud/                # Data access functions
│   │   ├── __init__.py
│   │   └── task.py
│   ├── routers/             # API route handlers (NEW)
│   │   ├── __init__.py
│   │   └── tasks.py
│   ├── schemas/             # Pydantic models (NEW)
│   │   ├── __init__.py
│   │   └── task.py
│   └── dependencies/        # FastAPI dependencies (NEW)
│       ├── __init__.py
│       └── user.py
└── tests/                   # API tests (NEW)
    ├── __init__.py
    ├── conftest.py
    └── test_tasks_api.py
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks` | List all user's tasks |
| GET | `/api/tasks/{id}` | Get a single task |
| PUT | `/api/tasks/{id}` | Update a task |
| DELETE | `/api/tasks/{id}` | Delete a task |
| PATCH | `/api/tasks/{id}/complete` | Toggle completion |

All endpoints require `X-User-ID` header.

---

## Common Issues

### Missing X-User-ID Header
```json
{"detail": "X-User-ID header is required"}
```
**Solution**: Add `-H "X-User-ID: your-user-id"` to requests.

### Task Not Found (404)
```json
{"detail": "Task not found"}
```
**Causes**:
- Task ID doesn't exist
- Task belongs to different user (X-User-ID mismatch)

### Validation Error (422)
```json
{"detail": [{"loc": ["body", "title"], "msg": "Field required", "type": "missing"}]}
```
**Solution**: Ensure required fields are provided with correct types.

---

## Next Steps

After Phase 2.2 is complete:
- **Phase 2.3**: Replace `X-User-ID` header with JWT authentication (Better Auth)
