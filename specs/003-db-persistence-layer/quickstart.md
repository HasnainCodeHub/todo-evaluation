# Quickstart: Database Persistence Layer (Phase 2.1)

**Feature**: 003-db-persistence-layer
**Date**: 2026-01-01

## Prerequisites

### 1. Neon PostgreSQL Database
- Create a Neon account at https://neon.tech
- Create a new project
- Copy the connection string from the dashboard

### 2. Environment Setup
Create a `.env` file in the project root:
```
DATABASE_URL=postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require
```

### 3. Python Dependencies
```bash
uv add sqlmodel psycopg2-binary python-dotenv
```

## Verification Steps

### Step 1: Verify Database Connection
```python
# Test connection to Neon PostgreSQL
from backend.app.database import get_engine

engine = get_engine()
print("Connection successful!" if engine else "Connection failed")
```

**Expected**: "Connection successful!" printed to console

### Step 2: Verify Table Creation
```python
# Initialize tables
from backend.app.database import init_db

init_db()
print("Tables created successfully")
```

**Expected**: Tables created in Neon database (verify in Neon console)

### Step 3: Verify CRUD Operations

#### Create Task
```python
from backend.app.crud import create_task

task = create_task(
    title="Test Task",
    description="Testing persistence",
    user_id="test-user-001"
)
print(f"Created task with ID: {task.id}")
```

**Expected**: Task created with auto-generated ID

#### Read Tasks
```python
from backend.app.crud import get_tasks

tasks = get_tasks(user_id="test-user-001")
print(f"Found {len(tasks)} tasks")
```

**Expected**: List containing the created task

#### Update Task
```python
from backend.app.crud import update_task

updated = update_task(task.id, title="Updated Title")
print(f"Updated task title: {updated.title}")
```

**Expected**: Task title changed to "Updated Title"

#### Toggle Complete
```python
from backend.app.crud import toggle_complete

toggled = toggle_complete(task.id)
print(f"Task completed: {toggled.completed}")
```

**Expected**: Task completed status is True

#### Delete Task
```python
from backend.app.crud import delete_task

deleted = delete_task(task.id)
print(f"Task deleted: {deleted}")
```

**Expected**: Returns True, task no longer in database

### Step 4: Verify User Scoping
```python
from backend.app.crud import create_task, get_tasks

# Create tasks for different users
create_task(title="User A Task", user_id="user-a")
create_task(title="User B Task", user_id="user-b")

# Query by user
user_a_tasks = get_tasks(user_id="user-a")
user_b_tasks = get_tasks(user_id="user-b")

print(f"User A: {len(user_a_tasks)} tasks")
print(f"User B: {len(user_b_tasks)} tasks")
```

**Expected**: Each user sees only their own tasks

### Step 5: Verify Persistence
```python
# In a new Python session after restarting
from backend.app.crud import get_tasks

tasks = get_tasks()
print(f"Total tasks after restart: {len(tasks)}")
```

**Expected**: Tasks persist across application restarts

## Success Criteria Mapping

| Success Criterion | Verification Step | Expected Result |
|-------------------|-------------------|-----------------|
| SC-001: Data persists | Step 5 | Tasks survive restart |
| SC-002: CRUD works | Steps 3a-3e | All operations succeed |
| SC-003: User isolation | Step 4 | Zero cross-user leakage |
| SC-004: Connection <5s | Step 1 | Connection under 5 seconds |
| SC-005: Phase I parity | Steps 3a-3e | Same 5 operations work |
| SC-006: Zero API endpoints | Code review | No REST endpoints in codebase |
| SC-007: Zero auth code | Code review | No JWT/auth in codebase |

## Troubleshooting

### Connection Refused
- Verify DATABASE_URL is correct
- Check Neon project is not suspended
- Ensure sslmode=require is in connection string

### Table Creation Fails
- Check database user has CREATE permissions
- Verify connection string points to correct database

### Import Errors
- Run `uv sync` to install dependencies
- Verify Python version is 3.11+

## Cleanup

To remove test data:
```python
from backend.app.crud import get_tasks, delete_task

for task in get_tasks():
    delete_task(task.id)
print("All tasks deleted")
```
