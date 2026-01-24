# Task Model Design

## Core Task Entity

The Task entity represents the fundamental unit of work in the task management system. It encapsulates all the necessary properties to track tasks with proper user scoping and state management.

### Properties

#### Essential Properties
- **id**: Unique identifier for the task (UUID)
- **user_id**: Identifier linking the task to its owner
- **title**: Short description of the task (required)
- **status**: Current state of the task (pending, in_progress, completed, archived)

#### Extended Properties
- **description**: Detailed information about the task
- **priority**: Importance level (low, medium, high, urgent)
- **due_date**: Deadline for task completion
- **created_at**: Timestamp when task was created
- **updated_at**: Timestamp when task was last modified

### Status Lifecycle

Tasks follow a specific lifecycle through different states:

```
PENDING → IN_PROGRESS → COMPLETED
    ↓           ↓           ↓
ARCHIVED ← (any state) ← (any state)
```

#### Status Transitions
- **Pending** → **In Progress**: When work begins on the task
- **In Progress** → **Completed**: When task is finished
- **Any State** → **Archived**: When task is no longer relevant
- **Completed** → **In Progress**: If task needs further work

### Priority Levels

Priority levels help users focus on important tasks:

| Level | Description | Color Code |
|-------|-------------|------------|
| Low | Nice to have, no immediate deadline | Blue |
| Medium | Standard priority, reasonable deadline | Green |
| High | Important task requiring attention | Yellow |
| Urgent | Critical task requiring immediate action | Red |

## Database Schema

### Table Structure
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

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### Indexing Strategy

#### Primary Indexes
- **Primary Key**: `id` - Ensures unique identification
- **User Index**: `user_id` - Optimizes user-specific queries
- **Status Index**: `status` - Improves status-based filtering
- **Due Date Index**: `due_date` - Optimizes deadline queries

#### Composite Indexes
For complex queries involving multiple filters:
```sql
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority);
CREATE INDEX idx_tasks_user_status_priority ON tasks(user_id, status, priority);
```

## Data Relationships

### User Relationship
- Each task belongs to exactly one user
- User deletion cascades to delete all associated tasks
- Foreign key constraint ensures referential integrity

### Related Entities
Tasks may connect to other entities in extended systems:
- **Categories**: Group tasks by category
- **Projects**: Associate tasks with specific projects
- **Tags**: Add multiple labels to tasks
- **Comments**: Track discussion on tasks

## Validation Rules

### Required Fields
- `user_id`: Cannot be null (ensures user ownership)
- `title`: Cannot be null or empty (ensures task identity)

### Data Constraints
- **Title Length**: Maximum 255 characters
- **Description Length**: Maximum 10000 characters
- **Status Values**: Only valid status values allowed
- **Priority Values**: Only valid priority values allowed
- **Date Range**: Due dates must be in the future (optional constraint)

### Business Rules
- **Ownership**: Tasks can only be modified by their owner
- **Status Transitions**: Only valid state transitions allowed
- **Uniqueness**: No duplicate titles for the same user (optional)
- **Dependency**: Blocked tasks cannot be marked as complete

## Serialization

### JSON Representation
```json
{
    "id": "uuid-string",
    "user_id": "user-uuid",
    "title": "Task title",
    "description": "Detailed description",
    "status": "pending|in_progress|completed|archived",
    "priority": "low|medium|high|urgent",
    "due_date": "2023-12-31T23:59:59Z",
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-01T12:00:00Z"
}
```

### Field Validation Schema
```json
{
    "type": "object",
    "properties": {
        "id": {"type": "string", "format": "uuid"},
        "user_id": {"type": "string", "format": "uuid"},
        "title": {"type": "string", "minLength": 1, "maxLength": 255},
        "description": {"type": "string", "maxLength": 10000},
        "status": {"enum": ["pending", "in_progress", "completed", "archived"]},
        "priority": {"enum": ["low", "medium", "high", "urgent"]},
        "due_date": {"type": "string", "format": "date-time"},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"}
    },
    "required": ["id", "user_id", "title"]
}
```

## Extensibility Points

### Custom Fields
The model supports extension for additional properties:
- **Custom Attributes**: JSON field for arbitrary properties
- **Metadata**: Key-value pairs for flexible data storage
- **Extensions**: Separate table for optional features

### Audit Trail
Consider adding audit capabilities:
- **Last Modified By**: Track who made changes
- **Change History**: Store modification records
- **Access Log**: Track who viewed the task

This design ensures the Task model is robust, scalable, and maintains proper user isolation while supporting the core CRUD operations required for task management.