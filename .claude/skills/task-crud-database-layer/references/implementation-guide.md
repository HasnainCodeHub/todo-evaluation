# Task CRUD Database Layer Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing a secure, scalable task management system with full CRUD operations and user scoping.

## Step 1: Set Up the Database Layer

### Initialize the Database
```python
from task_management.database import TaskDatabase

# Initialize database (creates tables if they don't exist)
db = TaskDatabase("tasks.db")
```

### Database Schema Creation
The database initialization automatically creates the required schema:
- `tasks` table with all necessary fields
- Indexes for optimized querying
- Foreign key constraints (if using foreign keys)

## Step 2: Implement the Service Layer

### Initialize the Service
```python
from task_management.service import TaskService

# Create service with database connection
service = TaskService(db)
```

### Core Operations Implementation

#### Create Task
```python
def create_new_task(user_id: str, title: str, **kwargs):
    """
    Create a new task with validation and user scoping
    """
    try:
        task_data = service.create_task(
            user_id=user_id,
            title=title,
            description=kwargs.get('description'),
            priority=kwargs.get('priority', 'medium'),
            due_date=kwargs.get('due_date')
        )
        return {"success": True, "task": task_data}
    except ValueError as e:
        return {"success": False, "error": str(e)}
```

#### Read Tasks
```python
def get_user_tasks(user_id: str, filters: dict = None):
    """
    Retrieve tasks for a specific user with optional filters
    """
    filters = filters or {}

    tasks = service.list_tasks(
        user_id=user_id,
        status=filters.get('status'),
        priority=filters.get('priority'),
        search=filters.get('search'),
        limit=filters.get('limit', 50),
        offset=filters.get('offset', 0)
    )

    return {"tasks": tasks, "count": len(tasks)}
```

#### Update Task
```python
def update_existing_task(task_id: str, user_id: str, updates: dict):
    """
    Update a task with validation and user verification
    """
    try:
        updated_task = service.update_task(
            task_id=task_id,
            user_id=user_id,
            title=updates.get('title'),
            description=updates.get('description'),
            status=updates.get('status'),
            priority=updates.get('priority'),
            due_date=updates.get('due_date')
        )
        return {"success": True, "task": updated_task}
    except ValueError as e:
        return {"success": False, "error": str(e)}
```

#### Complete Task
```python
def complete_task(task_id: str, user_id: str):
    """
    Mark a task as completed
    """
    try:
        completed_task = service.complete_task(task_id, user_id)
        return {"success": True, "task": completed_task}
    except ValueError as e:
        return {"success": False, "error": str(e)}
```

#### Delete Task
```python
def delete_task(task_id: str, user_id: str):
    """
    Delete a task with user verification
    """
    try:
        result = service.delete_task(task_id, user_id)
        return {"success": True, "result": result}
    except ValueError as e:
        return {"success": False, "error": str(e)}
```

## Step 3: Implement User Scoping

### User Context Provider
```python
class UserContextProvider:
    """
    Provide current user context for task operations
    """
    def __init__(self, auth_service):
        self.auth_service = auth_service

    def get_current_user_id(self, request) -> str:
        """
        Extract user ID from request context
        """
        # Implementation depends on authentication method
        # Could be JWT, session, API key, etc.
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            raise PermissionError("Authentication required")

        # Extract user ID from token
        token = auth_header.replace('Bearer ', '')
        user_id = self.auth_service.verify_token(token)

        if not user_id:
            raise PermissionError("Invalid or expired token")

        return user_id
```

### Secured Controller
```python
class SecuredTaskController:
    """
    Controller with user scoping enforcement
    """
    def __init__(self, service: TaskService, user_provider: UserContextProvider):
        self.service = service
        self.user_provider = user_provider

    def create_task(self, request, task_data: dict):
        """
        Create task with user context
        """
        user_id = self.user_provider.get_current_user_id(request)
        return self.service.create_task(user_id, **task_data)

    def get_tasks(self, request, filters: dict = None):
        """
        Get user's tasks
        """
        user_id = self.user_provider.get_current_user_id(request)
        return self.service.list_tasks(user_id, **(filters or {}))

    def get_task(self, request, task_id: str):
        """
        Get specific task for user
        """
        user_id = self.user_provider.get_current_user_id(request)
        return self.service.get_task(task_id, user_id)

    def update_task(self, request, task_id: str, updates: dict):
        """
        Update user's task
        """
        user_id = self.user_provider.get_current_user_id(request)
        return self.service.update_task(task_id, user_id, **updates)

    def complete_task(self, request, task_id: str):
        """
        Complete user's task
        """
        user_id = self.user_provider.get_current_user_id(request)
        return self.service.complete_task(task_id, user_id)

    def delete_task(self, request, task_id: str):
        """
        Delete user's task
        """
        user_id = self.user_provider.get_current_user_id(request)
        return self.service.delete_task(task_id, user_id)
```

## Step 4: Add Business Logic Validation

### Status Transition Validation
```python
def validate_status_transition(current_status: str, new_status: str) -> bool:
    """
    Validate allowed status transitions
    """
    allowed_transitions = {
        'pending': ['in_progress', 'archived'],
        'in_progress': ['pending', 'completed', 'archived'],
        'completed': ['in_progress', 'archived'],
        'archived': ['pending']  # Allow unarchiving
    }

    return new_status in allowed_transitions.get(current_status, [])

# Use in update operations
def update_task_with_validation(task_id: str, user_id: str, updates: dict):
    """
    Update task with business logic validation
    """
    if 'status' in updates:
        # Get current task to validate transition
        current_task = service.get_task(task_id, user_id)
        if not validate_status_transition(current_task['status'], updates['status']):
            raise ValueError(f"Invalid status transition: {current_task['status']} → {updates['status']}")

    return service.update_task(task_id, user_id, **updates)
```

### Priority-Based Validation
```python
def validate_priority_logic(task_data: dict):
    """
    Validate business rules based on priority
    """
    errors = []

    if task_data.get('priority') == 'urgent' and not task_data.get('due_date'):
        errors.append("Urgent tasks must have a due date")

    if task_data.get('priority') == 'urgent':
        from datetime import datetime, timedelta
        due_date = datetime.fromisoformat(task_data['due_date'])
        if due_date < datetime.now() + timedelta(hours=1):
            errors.append("Urgent tasks must be due within reasonable timeframe")

    return errors
```

## Step 5: Error Handling and Missing Task Safety

### Safe Task Retrieval
```python
def get_task_safe(task_id: str, user_id: str) -> tuple:
    """
    Safely retrieve a task with error handling
    """
    try:
        task = service.get_task(task_id, user_id)
        return task, None
    except ValueError as e:
        if "not found" in str(e).lower():
            return None, {"type": "not_found", "message": "Task not found"}
        else:
            return None, {"type": "access_denied", "message": "Access denied"}
    except Exception as e:
        return None, {"type": "unexpected", "message": f"Unexpected error: {str(e)}"}
```

### Comprehensive Error Handler
```python
def handle_task_operation(operation_func, *args, **kwargs):
    """
    Generic handler for task operations with comprehensive error handling
    """
    try:
        result = operation_func(*args, **kwargs)
        return {
            "success": True,
            "data": result,
            "error": None
        }
    except ValueError as e:
        # Validation or business logic errors
        return {
            "success": False,
            "data": None,
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except PermissionError as e:
        # Access control errors
        return {
            "success": False,
            "data": None,
            "error": {
                "type": "permission_error",
                "message": str(e)
            }
        }
    except Exception as e:
        # Unexpected errors
        return {
            "success": False,
            "data": None,
            "error": {
                "type": "unexpected_error",
                "message": f"An unexpected error occurred: {str(e)}"
            }
        }
```

## Step 6: Testing and Validation

### Unit Tests
```python
import unittest
from unittest.mock import Mock, patch

class TestTaskCRUD(unittest.TestCase):
    def setUp(self):
        self.db_mock = Mock()
        self.service = TaskService(self.db_mock)

    def test_create_task_success(self):
        """Test successful task creation"""
        self.db_mock.create_task.return_value = Mock()
        self.db_mock.create_task.return_value.to_dict.return_value = {
            'id': '123',
            'title': 'Test Task',
            'user_id': 'user123'
        }

        result = self.service.create_task('user123', 'Test Task')

        self.assertEqual(result['title'], 'Test Task')
        self.db_mock.create_task.assert_called_once()

    def test_get_task_user_scoping(self):
        """Test that users can only access their own tasks"""
        self.db_mock.get_task.return_value = None

        with self.assertRaises(ValueError):
            self.service.get_task('task123', 'different_user')

    def test_update_task_validation(self):
        """Test status transition validation"""
        task_mock = Mock()
        task_mock.can_transition_to.return_value = False

        self.db_mock.get_task.return_value = task_mock

        with self.assertRaises(ValueError) as context:
            self.service.update_task('task123', 'user123', status='completed')

        self.assertIn('Cannot transition', str(context.exception))
```

### Integration Tests
```python
class TestTaskIntegration(unittest.TestCase):
    def setUp(self):
        # Use in-memory database for tests
        self.db = TaskDatabase(":memory:")
        self.service = TaskService(self.db)

    def test_full_crud_workflow(self):
        """Test complete CRUD workflow"""
        user_id = "test_user"

        # Create
        created_task = self.service.create_task(user_id, "Test Task")
        self.assertIsNotNone(created_task['id'])

        # Read
        retrieved_task = self.service.get_task(created_task['id'], user_id)
        self.assertEqual(retrieved_task['title'], "Test Task")

        # Update
        updated_task = self.service.update_task(
            created_task['id'],
            user_id,
            title="Updated Task"
        )
        self.assertEqual(updated_task['title'], "Updated Task")

        # Complete
        completed_task = self.service.complete_task(created_task['id'], user_id)
        self.assertEqual(completed_task['status'], "completed")

        # Delete
        delete_result = self.service.delete_task(created_task['id'], user_id)
        self.assertTrue(delete_result['deleted'])
```

## Step 7: Performance Optimization

### Query Optimization
```python
# Use indexes for common queries
# The database layer automatically creates these indexes:
# - idx_tasks_user_id
# - idx_tasks_status
# - idx_tasks_priority
# - idx_tasks_due_date

# For complex queries, use composite indexes
def create_composite_indexes(db_path: str):
    """
    Create additional composite indexes for performance
    """
    with sqlite3.connect(db_path) as conn:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC)')
```

### Pagination Implementation
```python
def get_paginated_tasks(user_id: str, page: int = 1, per_page: int = 20):
    """
    Get paginated tasks for a user
    """
    offset = (page - 1) * per_page

    return service.list_tasks(
        user_id=user_id,
        limit=per_page,
        offset=offset
    )
```

## Best Practices Summary

1. **Always validate user permissions** before any database operation
2. **Implement proper error handling** with meaningful messages
3. **Use parameterized queries** to prevent SQL injection
4. **Validate business logic** like status transitions
5. **Handle missing tasks gracefully** with appropriate error responses
6. **Use transactions** for multi-step operations
7. **Implement proper logging** for audit trails
8. **Create indexes** for frequently queried fields
9. **Use pagination** for list operations
10. **Test thoroughly** with both unit and integration tests

This implementation guide provides a complete framework for building a secure, scalable task management system with proper user scoping and business logic enforcement.