# Claude Code Rules — Backend Layer

This file provides layer-specific context for the Evolution of Todo backend application.

**Inherits from**: Root `CLAUDE.md` (project-wide rules apply)

## Technology Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM**: SQLModel
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: JWT verification (tokens issued by frontend Better Auth)

## Spec Referencing

All feature implementation must reference approved specifications:

```
@specs/features/<feature-name>/spec.md  — Requirements
@specs/features/<feature-name>/plan.md  — Architecture decisions
@specs/features/<feature-name>/tasks.md — Implementation tasks
@specs/api/<endpoint>/spec.md           — API endpoint specs
@specs/database/<model>/spec.md         — Database model specs
```

Before implementing any feature:
1. Read the relevant spec files
2. Verify task status in tasks.md
3. Follow the plan.md architecture

## Boundary Rules

**This layer is responsible for:**
- REST API endpoint implementation
- Business logic and validation
- Database operations via SQLModel
- JWT token verification
- User-scoped data access (ownership enforcement)
- Error handling and HTTP status codes

**This layer MUST NOT:**
- Render HTML or UI components
- Manage user sessions (frontend responsibility)
- Issue JWT tokens (Better Auth responsibility)
- Expose database credentials
- Allow cross-user data access without authorization

## API Design Pattern

Follow RESTful conventions:

```python
# Correct: RESTful resource-based routes
@router.get("/tasks")           # List user's tasks
@router.post("/tasks")          # Create task
@router.get("/tasks/{id}")      # Get specific task
@router.put("/tasks/{id}")      # Update task
@router.delete("/tasks/{id}")   # Delete task

# User-scoped queries
async def get_tasks(current_user: User = Depends(get_current_user)):
    return await Task.filter(owner_id=current_user.id)
```

## Authentication Flow

1. Frontend sends JWT in Authorization header
2. Backend verifies JWT signature
3. Extract user ID from token claims
4. Scope all data queries to that user

```python
# Dependency for protected routes
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = verify_jwt(token)
    return await User.get(id=payload["sub"])
```

## File Organization

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Environment configuration
│   ├── database.py          # Database connection
│   ├── models/              # SQLModel models
│   │   ├── user.py
│   │   └── task.py
│   ├── routers/             # API route handlers
│   │   ├── auth.py
│   │   └── tasks.py
│   ├── services/            # Business logic
│   │   └── task_service.py
│   ├── schemas/             # Pydantic schemas
│   │   └── task.py
│   └── dependencies/        # FastAPI dependencies
│       └── auth.py
├── tests/                   # Test files
├── alembic/                 # Database migrations
└── requirements.txt         # Python dependencies
```

## Database Rules

- Use SQLModel for all database operations
- Define models with proper relationships
- Use async database operations
- Never expose raw SQL to user input
- Apply migrations for schema changes

```python
class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str | None = None
    completed: bool = False
    owner_id: int = Field(foreign_key="user.id")
```

## Code Standards

- Type hints required on all functions
- Async/await for database operations
- Pydantic for request/response validation
- Proper HTTP status codes
- Structured error responses
- Logging for debugging

## Phase Applicability

- **Phase 2.3+**: Backend implementation begins
- **Current Phase (2.0)**: Governance only — no backend code yet
