#!/usr/bin/env python3
"""
Task Model and Database Generator

This script generates a complete task management model with database integration,
including all CRUD operations and user scoping enforcement.
"""

import os
import sys
from pathlib import Path
import argparse
from typing import Dict, Any, List


def create_task_model_files(project_name: str, output_dir: str = None) -> str:
    """Generate complete task model files."""

    if output_dir is None:
        output_dir = project_name

    # Create project directory
    os.makedirs(output_dir, exist_ok=True)

    # Create models.py
    models_content = '''"""
Task Models for the Task Management System

This module defines the core Task model and related entities
with proper user scoping and business logic enforcement.
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
import uuid


class TaskStatus(Enum):
    """Enumeration of possible task statuses."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class TaskPriority(Enum):
    """Enumeration of task priorities."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task:
    """Represents a single task in the system."""

    def __init__(
        self,
        id: Optional[str] = None,
        user_id: str = "",
        title: str = "",
        description: Optional[str] = None,
        status: TaskStatus = TaskStatus.PENDING,
        priority: TaskPriority = TaskPriority.MEDIUM,
        due_date: Optional[datetime] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.id = id or str(uuid.uuid4())
        self.user_id = user_id
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.due_date = due_date
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()

    def to_dict(self) -> dict:
        """Convert task to dictionary representation."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "status": self.status.value,
            "priority": self.priority.value,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        """Create Task instance from dictionary."""
        return cls(
            id=data.get("id"),
            user_id=data["user_id"],
            title=data["title"],
            description=data.get("description"),
            status=TaskStatus(data["status"]),
            priority=TaskPriority(data["priority"]),
            due_date=datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None
        )

    def validate(self) -> List[str]:
        """Validate the task and return list of validation errors."""
        errors = []

        if not self.user_id:
            errors.append("user_id is required")

        if not self.title or not self.title.strip():
            errors.append("title is required and cannot be empty")

        if len(self.title) > 255:
            errors.append("title cannot exceed 255 characters")

        if self.description and len(self.description) > 10000:
            errors.append("description cannot exceed 10000 characters")

        return errors

    def can_transition_to(self, new_status: TaskStatus) -> bool:
        """Check if task can transition to the new status."""
        allowed_transitions = {
            TaskStatus.PENDING: [TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
            TaskStatus.IN_PROGRESS: [TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.ARCHIVED],
            TaskStatus.COMPLETED: [TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
            TaskStatus.ARCHIVED: [TaskStatus.PENDING]  # Unarchive
        }

        return new_status in allowed_transitions.get(self.status, [])


class TaskFilter:
    """Filter criteria for task queries."""

    def __init__(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        due_after: Optional[datetime] = None,
        due_before: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0
    ):
        self.status = status
        self.priority = priority
        self.search = search
        self.due_after = due_after
        self.due_before = due_before
        self.limit = min(limit, 100)  # Cap at 100 per page
        self.offset = offset

    def to_dict(self) -> dict:
        """Convert filter to dictionary."""
        return {
            "status": self.status,
            "priority": self.priority,
            "search": self.search,
            "due_after": self.due_after.isoformat() if self.due_after else None,
            "due_before": self.due_before.isoformat() if self.due_before else None,
            "limit": self.limit,
            "offset": self.offset
        }
'''

    models_path = os.path.join(output_dir, "models.py")
    with open(models_path, 'w') as f:
        f.write(models_content)

    # Create database.py
    db_content = '''"""
Database Layer for Task Management

This module provides database operations for tasks
with proper user scoping and transaction safety.
"""
import sqlite3
from typing import List, Optional
from contextlib import contextmanager
from .models import Task, TaskStatus, TaskPriority, TaskFilter


class TaskDatabase:
    """Database operations for tasks with user scoping."""

    def __init__(self, db_path: str = "tasks.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize database with tasks table."""
        with self.get_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    due_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)')

    @contextmanager
    def get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def create_task(self, task: Task) -> Optional[Task]:
        """Create a new task in the database."""
        errors = task.validate()
        if errors:
            raise ValueError(f"Task validation failed: {'; '.join(errors)}")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                task.id, task.user_id, task.title, task.description,
                task.status.value, task.priority.value, task.due_date
            ))

            # Return the created task
            return self.get_task(task.id, task.user_id)

    def get_task(self, task_id: str, user_id: str) -> Optional[Task]:
        """Get a specific task for a user."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, user_id)
            )
            row = cursor.fetchone()

            if row:
                return self._row_to_task(row)

            return None

    def list_tasks(self, user_id: str, filter_obj: Optional[TaskFilter] = None) -> List[Task]:
        """List tasks for a user with optional filters."""
        query_parts = ["SELECT * FROM tasks WHERE user_id = ?"]
        params = [user_id]

        if filter_obj:
            if filter_obj.status:
                query_parts.append("AND status = ?")
                params.append(filter_obj.status)

            if filter_obj.priority:
                query_parts.append("AND priority = ?")
                params.append(filter_obj.priority)

            if filter_obj.search:
                query_parts.append("AND (title LIKE ? OR description LIKE ?)")
                search_param = f"%{filter_obj.search}%"
                params.extend([search_param, search_param])

            if filter_obj.due_after:
                query_parts.append("AND due_date >= ?")
                params.append(filter_obj.due_after)

            if filter_obj.due_before:
                query_parts.append("AND due_date <= ?")
                params.append(filter_obj.due_before)

        query_parts.append("ORDER BY created_at DESC LIMIT ? OFFSET ?")
        params.extend([filter_obj.limit if filter_obj else 50, filter_obj.offset if filter_obj else 0])

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(" ".join(query_parts), params)
            rows = cursor.fetchall()

            return [self._row_to_task(row) for row in rows]

    def update_task(self, task_id: str, user_id: str, **updates) -> Optional[Task]:
        """Update a task with user validation."""
        # Validate task exists and belongs to user
        existing_task = self.get_task(task_id, user_id)
        if not existing_task:
            raise ValueError("Task not found or access denied")

        # Validate updates
        valid_fields = {'title', 'description', 'status', 'priority', 'due_date'}
        filtered_updates = {k: v for k, v in updates.items() if k in valid_fields and v is not None}

        if not filtered_updates:
            return existing_task

        # Validate status transition if changing status
        if 'status' in filtered_updates:
            new_status = TaskStatus(filtered_updates['status'])
            if not existing_task.can_transition_to(new_status):
                raise ValueError(f"Cannot transition from {existing_task.status.value} to {new_status.value}")

        # Update timestamp
        filtered_updates['updated_at'] = datetime.now()

        with self.get_connection() as conn:
            set_clause = ", ".join([f"{k} = ?" for k in filtered_updates.keys()])
            params = list(filtered_updates.values()) + [task_id, user_id]

            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE tasks SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
                params
            )

            if cursor.rowcount == 0:
                raise ValueError("Task not found or access denied")

        # Return updated task
        return self.get_task(task_id, user_id)

    def complete_task(self, task_id: str, user_id: str) -> bool:
        """Mark a task as completed."""
        try:
            updated_task = self.update_task(
                task_id, user_id,
                status=TaskStatus.COMPLETED.value
            )
            return updated_task is not None
        except ValueError:
            return False

    def delete_task(self, task_id: str, user_id: str) -> bool:
        """Delete a task with user validation."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM tasks WHERE id = ? AND user_id = ?",
                (task_id, user_id)
            )

            return cursor.rowcount > 0

    def _row_to_task(self, row) -> Task:
        """Convert database row to Task object."""
        from datetime import datetime

        return Task(
            id=row['id'],
            user_id=row['user_id'],
            title=row['title'],
            description=row['description'],
            status=TaskStatus(row['status']),
            priority=TaskPriority(row['priority']),
            due_date=datetime.fromisoformat(row['due_date']) if row['due_date'] else None,
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
            updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None
        )
'''

    db_path = os.path.join(output_dir, "database.py")
    with open(db_path, 'w') as f:
        f.write(db_content)

    # Create service.py
    service_content = '''"""
Task Service Layer

This module provides business logic for task management
with proper user scoping and error handling.
"""
from typing import List, Optional, Dict, Any
from .models import Task, TaskStatus, TaskPriority, TaskFilter
from .database import TaskDatabase


class TaskService:
    """Business logic layer for task management."""

    def __init__(self, db: TaskDatabase):
        self.db = db

    def create_task(
        self,
        user_id: str,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new task."""
        # Validate inputs
        if not title or not title.strip():
            raise ValueError("Title is required")

        if priority not in ["low", "medium", "high", "urgent"]:
            raise ValueError(f"Invalid priority: {priority}")

        # Parse due date if provided
        from datetime import datetime
        parsed_due_date = None
        if due_date:
            try:
                parsed_due_date = datetime.fromisoformat(due_date)
            except ValueError:
                raise ValueError("Invalid date format")

        # Create task object
        task = Task(
            user_id=user_id,
            title=title.strip(),
            description=description,
            priority=TaskPriority(priority),
            due_date=parsed_due_date
        )

        # Save to database
        created_task = self.db.create_task(task)
        if not created_task:
            raise ValueError("Failed to create task")

        return created_task.to_dict()

    def get_task(self, task_id: str, user_id: str) -> Dict[str, Any]:
        """Get a specific task."""
        task = self.db.get_task(task_id, user_id)
        if not task:
            raise ValueError("Task not found or access denied")

        return task.to_dict()

    def list_tasks(
        self,
        user_id: str,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List tasks for a user."""
        filter_obj = TaskFilter(
            status=status,
            priority=priority,
            search=search,
            limit=limit,
            offset=offset
        )

        tasks = self.db.list_tasks(user_id, filter_obj)
        return [task.to_dict() for task in tasks]

    def update_task(
        self,
        task_id: str,
        user_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an existing task."""
        updates = {}
        if title is not None:
            updates['title'] = title
        if description is not None:
            updates['description'] = description
        if status is not None:
            updates['status'] = status
        if priority is not None:
            updates['priority'] = priority
        if due_date is not None:
            updates['due_date'] = due_date

        updated_task = self.db.update_task(task_id, user_id, **updates)
        if not updated_task:
            raise ValueError("Task not found or could not be updated")

        return updated_task.to_dict()

    def complete_task(self, task_id: str, user_id: str) -> Dict[str, Any]:
        """Complete a task."""
        success = self.db.complete_task(task_id, user_id)
        if not success:
            raise ValueError("Task not found or could not be completed")

        task = self.db.get_task(task_id, user_id)
        if not task:
            raise ValueError("Task not found after completion")

        return task.to_dict()

    def delete_task(self, task_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a task."""
        success = self.db.delete_task(task_id, user_id)
        if not success:
            raise ValueError("Task not found or could not be deleted")

        return {"id": task_id, "deleted": True}
'''

    service_path = os.path.join(output_dir, "service.py")
    with open(service_path, 'w') as f:
        f.write(service_content)

    # Create __init__.py
    init_content = '''"""
Task Management Package

This package provides a complete task management system
with CRUD operations, user scoping, and business logic enforcement.
"""
from .models import Task, TaskStatus, TaskPriority, TaskFilter
from .database import TaskDatabase
from .service import TaskService

__all__ = [
    'Task',
    'TaskStatus',
    'TaskPriority',
    'TaskFilter',
    'TaskDatabase',
    'TaskService'
]
'''

    init_path = os.path.join(output_dir, "__init__.py")
    with open(init_path, 'w') as f:
        f.write(init_content)

    # Create README.md
    readme_content = f"""# {project_name} - Task Management System

This is a complete task management system with CRUD operations and user scoping.

## Features

- **Create, Read, Update, Delete** operations for tasks
- **User scoping** to ensure data isolation
- **Business logic enforcement** with status transitions
- **Input validation** and error handling
- **Database integration** with SQLite

## Installation

```bash
pip install -r requirements.txt
```

## Usage

```python
from {project_name} import TaskDatabase, TaskService

# Initialize the system
db = TaskDatabase("tasks.db")
service = TaskService(db)

# Create a task
task_data = service.create_task(
    user_id="user123",
    title="Complete project",
    description="Finish the project by Friday",
    priority="high"
)

print(f"Created task: {task_data['id']}")
```

## Architecture

- **Models**: Define the data structures
- **Database**: Handle persistence with user scoping
- **Service**: Implement business logic and validation
"""

    readme_path = os.path.join(output_dir, "README.md")
    with open(readme_path, 'w') as f:
        f.write(readme_content)

    return f"Task management model files created in {output_dir}/"


def main():
    parser = argparse.ArgumentParser(description='Generate Task Management Model')
    parser.add_argument('--name', required=True, help='Project name')
    parser.add_argument('--output-dir', help='Output directory (defaults to project name)')

    args = parser.parse_args()

    result = create_task_model_files(args.name, args.output_dir)
    print(result)


if __name__ == "__main__":
    main()