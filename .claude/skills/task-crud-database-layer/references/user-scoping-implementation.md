# User Scoping Implementation

## Overview

User scoping ensures that each user can only access, modify, and delete their own tasks. This is a critical security feature that prevents unauthorized data access and maintains data privacy.

## Database-Level Implementation

### Row-Level Security (RLS)

Row-level security is implemented at the database level to ensure that even if application logic is bypassed, the database itself prevents unauthorized access.

#### PostgreSQL Implementation
```sql
-- Enable RLS on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for task access
CREATE POLICY task_access_policy ON tasks
FOR ALL TO app_user
USING (user_id = current_setting('app.current_user_id')::text);

-- Create function to set user ID in session
CREATE OR REPLACE FUNCTION set_user_context(user_id TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql;
```

#### SQLite Implementation
SQLite doesn't have native RLS, so application-level enforcement is crucial:

```python
class SecureTaskDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _execute_with_user_scope(self, query: str, params: tuple, user_id: str):
        """
        Execute query with mandatory user_id scoping
        """
        # Ensure user_id is part of every query
        if "WHERE" in query.upper() and "user_id" not in query:
            raise ValueError("User scope missing from query")

        # Add user_id to parameters if not present
        if user_id not in params:
            params = (*params, user_id)

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchall()
```

### Foreign Key Constraints

Ensure referential integrity with proper foreign key relationships:

```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Application-Level Implementation

### Service Layer Enforcement

Every service method must validate user permissions:

```python
class TaskService:
    def __init__(self, db: TaskDatabase):
        self.db = db

    def get_user_task(self, task_id: str, user_id: str) -> Optional[Task]:
        """
        Retrieve a task ensuring it belongs to the requesting user
        """
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, user_id)
            )
            row = cursor.fetchone()

            if not row:
                return None  # Task doesn't exist or doesn't belong to user

            return self._row_to_task(row)

    def update_user_task(self, task_id: str, user_id: str, **updates) -> bool:
        """
        Update a task ensuring it belongs to the requesting user
        """
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
            params = list(updates.values()) + [task_id, user_id]

            cursor.execute(
                f"UPDATE tasks SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
                params
            )

            return cursor.rowcount > 0  # Returns True if update succeeded
```

### Repository Pattern with Scoping

Implement a repository pattern that enforces scoping:

```python
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

class TaskRepository(ABC):
    @abstractmethod
    def create(self, user_id: str, task_data: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def find_by_id(self, task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def find_by_user(self, user_id: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def update(self, task_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    def delete(self, task_id: str, user_id: str) -> bool:
        pass

class SqliteTaskRepository(TaskRepository):
    def __init__(self, db_path: str):
        self.db_path = db_path

    def create(self, user_id: str, task_data: Dict[str, Any]) -> str:
        task_id = str(uuid.uuid4())

        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                '''
                INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    task_id, user_id, task_data['title'], task_data.get('description'),
                    task_data.get('status', 'pending'), task_data.get('priority', 'medium'),
                    task_data.get('due_date')
                )
            )

        return task_id

    def find_by_id(self, task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, user_id)
            )
            row = cursor.fetchone()

            if row:
                return dict(row)
            return None

    def find_by_user(self, user_id: str, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM tasks WHERE user_id = ?"
        params = [user_id]

        if filters:
            if 'status' in filters:
                query += " AND status = ?"
                params.append(filters['status'])

        query += " ORDER BY created_at DESC"

        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()

            return [dict(row) for row in rows]

    def update(self, task_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        params = list(updates.values()) + [task_id, user_id]

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE tasks SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
                params
            )
            return cursor.rowcount > 0

    def delete(self, task_id: str, user_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, user_id)
            )
            return cursor.rowcount > 0
```

## Authentication Integration

### User Context Provider

Create a provider that supplies the current user context:

```python
from abc import ABC, abstractmethod
from typing import Optional

class UserContextProvider(ABC):
    @abstractmethod
    def get_current_user_id(self) -> Optional[str]:
        pass

class SessionUserContextProvider(UserContextProvider):
    def __init__(self, session_manager):
        self.session_manager = session_manager

    def get_current_user_id(self) -> Optional[str]:
        session_id = self._get_session_id_from_request()
        return self.session_manager.get_user_id(session_id)

    def _get_session_id_from_request(self) -> str:
        # Implementation depends on framework
        # Could extract from headers, cookies, etc.
        pass

class JwtUserContextProvider(UserContextProvider):
    def __init__(self, jwt_secret: str):
        self.jwt_secret = jwt_secret

    def get_current_user_id(self) -> Optional[str]:
        token = self._get_jwt_from_request()
        if not token:
            return None

        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload.get("user_id")
        except jwt.InvalidTokenError:
            return None

    def _get_jwt_from_request(self) -> Optional[str]:
        # Extract JWT from Authorization header
        pass
```

### Secure Task Controller

Integrate user context into task operations:

```python
class SecureTaskController:
    def __init__(self,
                 task_repository: TaskRepository,
                 user_provider: UserContextProvider):
        self.task_repository = task_repository
        self.user_provider = user_provider

    def get_user_tasks(self, filters: Dict[str, Any] = None):
        user_id = self.user_provider.get_current_user_id()
        if not user_id:
            raise PermissionError("User not authenticated")

        return self.task_repository.find_by_user(user_id, filters)

    def create_task(self, task_data: Dict[str, Any]):
        user_id = self.user_provider.get_current_user_id()
        if not user_id:
            raise PermissionError("User not authenticated")

        # Validate task data
        if not task_data.get('title'):
            raise ValueError("Title is required")

        return self.task_repository.create(user_id, task_data)

    def get_task(self, task_id: str):
        user_id = self.user_provider.get_current_user_id()
        if not user_id:
            raise PermissionError("User not authenticated")

        task = self.task_repository.find_by_id(task_id, user_id)
        if not task:
            raise PermissionError("Task not found or access denied")

        return task

    def update_task(self, task_id: str, updates: Dict[str, Any]):
        user_id = self.user_provider.get_current_user_id()
        if not user_id:
            raise PermissionError("User not authenticated")

        success = self.task_repository.update(task_id, user_id, updates)
        if not success:
            raise PermissionError("Task not found or access denied")

        return success

    def delete_task(self, task_id: str):
        user_id = self.user_provider.get_current_user_id()
        if not user_id:
            raise PermissionError("User not authenticated")

        success = self.task_repository.delete(task_id, user_id)
        if not success:
            raise PermissionError("Task not found or access denied")

        return success
```

## Security Testing

### Scoping Validation Tests

Test that users cannot access each other's tasks:

```python
import unittest
from unittest.mock import Mock

class TestUserScoping(unittest.TestCase):
    def setUp(self):
        self.repository = Mock(spec=SqliteTaskRepository)
        self.user_provider = Mock(spec=UserContextProvider)
        self.controller = SecureTaskController(self.repository, self.user_provider)

    def test_user_cannot_access_other_users_task(self):
        # Arrange
        user_a_id = "user-a-123"
        user_b_id = "user-b-456"
        task_id = "task-xyz"

        self.user_provider.get_current_user_id.return_value = user_a_id
        self.repository.find_by_id.return_value = None  # Task belongs to user B

        # Act & Assert
        with self.assertRaises(PermissionError):
            self.controller.get_task(task_id)

    def test_user_can_access_own_task(self):
        # Arrange
        user_id = "user-abc"
        task_id = "task-xyz"
        task_data = {"id": task_id, "title": "My Task", "user_id": user_id}

        self.user_provider.get_current_user_id.return_value = user_id
        self.repository.find_by_id.return_value = task_data

        # Act
        result = self.controller.get_task(task_id)

        # Assert
        self.assertEqual(result, task_data)

    def test_user_cannot_update_other_users_task(self):
        # Arrange
        user_a_id = "user-a-123"
        user_b_id = "user-b-456"
        task_id = "task-xyz"

        self.user_provider.get_current_user_id.return_value = user_a_id
        self.repository.update.return_value = False  # Update failed (task belongs to user B)

        # Act & Assert
        with self.assertRaises(PermissionError):
            self.controller.update_task(task_id, {"title": "Updated Title"})
```

## Performance Considerations

### Indexing for Scoping Queries

Ensure proper indexing for user-scoped queries:

```sql
-- Primary index for user-based queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Composite index for common filter combinations
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority);

-- Covering index for common projections
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
```

### Query Optimization

Optimize queries to leverage user scoping for performance:

```python
def get_user_tasks_optimized(self, user_id: str, limit: int = 50, offset: int = 0):
    """
    Optimized query that leverages user_id index
    """
    with self.db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, title, status, priority, due_date, created_at
            FROM tasks
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset)
        )
        rows = cursor.fetchall()

        return [dict(row) for row in rows]
```

User scoping is essential for security and must be implemented at multiple layers (database, application, authentication) to provide defense in depth against unauthorized access.