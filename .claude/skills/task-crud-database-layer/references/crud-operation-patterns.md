# CRUD Operation Patterns for Task Management

## Overview

This document outlines the standard patterns for Create, Read, Update, and Delete operations in the task management system, with emphasis on user scoping and data integrity.

## Create Operations

### Add Task Pattern
```python
def add_task(self, user_id: str, title: str, description: str = None,
            priority: str = "medium", due_date: str = None) -> Task:
    """
    Add a new task to the database with validation
    """
    # 1. Validate required fields
    if not title or not title.strip():
        raise ValueError("Title is required and cannot be empty")

    # 2. Validate user_id format
    if not self._is_valid_user_id(user_id):
        raise ValueError("Invalid user ID format")

    # 3. Normalize input data
    title = title.strip()
    description = description.strip() if description else None

    # 4. Validate priority value
    if priority not in ["low", "medium", "high", "urgent"]:
        raise ValueError("Invalid priority value")

    # 5. Parse due date if provided
    parsed_due_date = None
    if due_date:
        try:
            parsed_due_date = datetime.fromisoformat(due_date)
        except ValueError:
            raise ValueError("Invalid date format")

    # 6. Create task object
    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        priority=priority,
        due_date=parsed_due_date,
        status=TaskStatus.PENDING
    )

    # 7. Insert into database
    with self.get_connection() as conn:
        cursor = conn.cursor()

        # Generate UUID if not provided
        task_id = str(uuid.uuid4())
        task.id = task_id

        cursor.execute('''
            INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            task.id, task.user_id, task.title, task.description,
            task.status.value, task.priority, task.due_date
        ))

    # 8. Return created task
    return task
```

### Validation Rules for Create
- Title must be non-empty
- User ID must be valid
- Priority must be one of allowed values
- Due date must be valid ISO format
- Task status defaults to PENDING
- Description is optional

## Read Operations

### List Tasks Pattern
```python
def list_tasks(self, user_id: str, filters: dict = None, pagination: dict = None) -> List[Task]:
    """
    List tasks for a specific user with optional filters
    """
    # 1. Validate user_id
    if not self._is_valid_user_id(user_id):
        raise ValueError("Invalid user ID format")

    # 2. Build query with user scoping
    query_parts = ["SELECT * FROM tasks WHERE user_id = ?"]
    params = [user_id]

    # 3. Apply filters
    if filters:
        if 'status' in filters and filters['status']:
            query_parts.append("AND status = ?")
            params.append(filters['status'])

        if 'priority' in filters and filters['priority']:
            query_parts.append("AND priority = ?")
            params.append(filters['priority'])

        if 'search' in filters and filters['search']:
            query_parts.append("AND title LIKE ? OR description LIKE ?")
            search_param = f"%{filters['search']}%"
            params.extend([search_param, search_param])

    # 4. Apply ordering
    query_parts.append("ORDER BY created_at DESC")

    # 5. Apply pagination
    limit = 50  # default
    offset = 0

    if pagination:
        if 'limit' in pagination:
            limit = min(int(pagination['limit']), 100)  # max 100 per page
        if 'offset' in pagination:
            offset = int(pagination['offset'])

    query_parts.append("LIMIT ? OFFSET ?")
    params.extend([limit, offset])

    # 6. Execute query
    with self.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(" ".join(query_parts), params)
        rows = cursor.fetchall()

        return [self._row_to_task(row) for row in rows]
```

### Get Single Task Pattern
```python
def get_task(self, task_id: str, user_id: str) -> Optional[Task]:
    """
    Get a specific task for a user
    """
    # 1. Validate IDs
    if not self._is_valid_task_id(task_id) or not self._is_valid_user_id(user_id):
        raise ValueError("Invalid task or user ID format")

    # 2. Query with user scoping
    with self.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, user_id)
        )
        row = cursor.fetchone()

        if row:
            return self._row_to_task(row)

        return None  # Task not found or access denied
```

## Update Operations

### Update Task Pattern
```python
def update_task(self, task_id: str, user_id: str, **updates) -> Optional[Task]:
    """
    Update a task with user validation and business logic
    """
    # 1. Validate IDs
    if not self._is_valid_task_id(task_id) or not self._is_valid_user_id(user_id):
        raise ValueError("Invalid task or user ID format")

    # 2. Verify task exists and belongs to user
    existing_task = self.get_task(task_id, user_id)
    if not existing_task:
        raise ValueError("Task not found or access denied")

    # 3. Validate updates
    valid_fields = {'title', 'description', 'status', 'priority', 'due_date'}
    filtered_updates = {k: v for k, v in updates.items() if k in valid_fields}

    if not filtered_updates:
        return existing_task  # No valid updates provided

    # 4. Validate individual field values
    if 'title' in filtered_updates:
        title = filtered_updates['title']
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")
        filtered_updates['title'] = title.strip()

    if 'status' in filtered_updates:
        status = filtered_updates['status']
        if status not in [s.value for s in TaskStatus]:
            raise ValueError(f"Invalid status: {status}")

    if 'priority' in filtered_updates:
        priority = filtered_updates['priority']
        if priority not in ["low", "medium", "high", "urgent"]:
            raise ValueError(f"Invalid priority: {priority}")

    if 'due_date' in filtered_updates and filtered_updates['due_date']:
        try:
            parsed_date = datetime.fromisoformat(filtered_updates['due_date'])
            filtered_updates['due_date'] = parsed_date
        except ValueError:
            raise ValueError("Invalid date format")

    # 5. Add updated_at timestamp
    filtered_updates['updated_at'] = datetime.now()

    # 6. Execute update
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

    # 7. Return updated task
    return self.get_task(task_id, user_id)
```

### Status Transition Validation
```python
def _validate_status_transition(self, current_status: TaskStatus, new_status: str) -> bool:
    """
    Validate allowed status transitions
    """
    allowed_transitions = {
        TaskStatus.PENDING: [TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
        TaskStatus.IN_PROGRESS: [TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.ARCHIVED],
        TaskStatus.COMPLETED: [TaskStatus.IN_PROGRESS, TaskStatus.ARCHIVED],
        TaskStatus.ARCHIVED: [TaskStatus.PENDING]  # Unarchive
    }

    return new_status in [s.value for s in allowed_transitions.get(current_status, [])]
```

## Delete Operations

### Delete Task Pattern
```python
def delete_task(self, task_id: str, user_id: str) -> bool:
    """
    Delete a task with user validation
    """
    # 1. Validate IDs
    if not self._is_valid_task_id(task_id) or not self._is_valid_user_id(user_id):
        raise ValueError("Invalid task or user ID format")

    # 2. Verify task exists and belongs to user
    existing_task = self.get_task(task_id, user_id)
    if not existing_task:
        raise ValueError("Task not found or access denied")

    # 3. Execute deletion
    with self.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, user_id)
        )

        return cursor.rowcount > 0
```

## Error Handling Patterns

### Safe Task Retrieval
```python
def get_task_safe(self, task_id: str, user_id: str) -> tuple[Optional[Task], Optional[str]]:
    """
    Safely retrieve a task with error messaging
    """
    try:
        task = self.get_task(task_id, user_id)
        return task, None
    except ValueError as e:
        return None, str(e)
    except Exception as e:
        return None, f"Unexpected error: {str(e)}"
```

### Bulk Operations
```python
def bulk_update_tasks(self, user_id: str, task_ids: List[str], updates: dict) -> dict:
    """
    Update multiple tasks for a user
    """
    results = {
        'success': [],
        'failed': [],
        'errors': []
    }

    for task_id in task_ids:
        try:
            updated_task = self.update_task(task_id, user_id, **updates)
            if updated_task:
                results['success'].append(task_id)
            else:
                results['failed'].append(task_id)
        except ValueError as e:
            results['failed'].append(task_id)
            results['errors'].append(f"{task_id}: {str(e)}")
        except Exception as e:
            results['failed'].append(task_id)
            results['errors'].append(f"{task_id}: Unexpected error - {str(e)}")

    return results
```

## Performance Optimization

### Batch Operations
```python
def batch_create_tasks(self, tasks: List[Task]) -> dict:
    """
    Create multiple tasks in a single transaction
    """
    results = {
        'created': [],
        'failed': [],
        'errors': []
    }

    with self.get_connection() as conn:
        cursor = conn.cursor()

        for i, task in enumerate(tasks):
            try:
                # Validate task
                if not task.title or not task.user_id:
                    raise ValueError("Required fields missing")

                # Generate ID if needed
                if not task.id:
                    task.id = str(uuid.uuid4())

                # Insert task
                cursor.execute('''
                    INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    task.id, task.user_id, task.title, task.description,
                    task.status.value, task.priority, task.due_date
                ))

                results['created'].append(task.id)

            except ValueError as e:
                results['failed'].append(i)
                results['errors'].append(f"Task {i}: {str(e)}")

    return results
```

## Security Considerations

### User Scoping Enforcement
Every operation must include the user_id in the WHERE clause to prevent cross-user access:
```sql
-- CORRECT: Always include user_id in WHERE clause
SELECT * FROM tasks WHERE id = ? AND user_id = ?

-- INCORRECT: Missing user_id validation
SELECT * FROM tasks WHERE id = ?
```

### Input Sanitization
All user inputs should be validated and sanitized before database operations:
- Validate data types
- Check length limits
- Sanitize special characters
- Use parameterized queries

These patterns ensure safe, efficient, and secure CRUD operations while maintaining proper user isolation and data integrity.