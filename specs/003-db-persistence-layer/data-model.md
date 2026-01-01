# Data Model: Database Persistence Layer (Phase 2.1)

**Feature**: 003-db-persistence-layer
**Date**: 2026-01-01
**Status**: Complete

## Entity Overview

Phase 2.1 introduces a single entity: **Task**. This entity replaces the in-memory Task from Phase I with a persistent database-backed model.

## Task Entity

### Definition

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key, Auto-increment | Unique task identifier |
| title | String(200) | Required, Max 200 chars | Task title |
| description | String(1000) | Optional, Max 1000 chars | Detailed task description |
| completed | Boolean | Default: False | Task completion status |
| user_id | String(255) | Required, Indexed | Owner identifier (string reference) |
| created_at | DateTime | Auto-generated, UTC | Creation timestamp |
| updated_at | DateTime | Auto-updated, UTC | Last modification timestamp |

### Field Details

#### id
- Auto-generated integer primary key
- Unique across all tasks
- Never reused after deletion

#### title
- Required field; cannot be null or empty
- Maximum 200 characters
- Used for display and identification

#### description
- Optional field; can be null
- Maximum 1000 characters
- Provides additional task context

#### completed
- Boolean flag for completion status
- Defaults to False on creation
- Toggled via toggle_complete operation

#### user_id
- String identifier for task ownership
- Required on all tasks
- Used for filtering in queries
- **Note**: No users table in Phase 2.1; this is a logical reference only
- Indexed for query performance

#### created_at
- Automatically set to current UTC time on creation
- Never modified after creation
- Used for sorting and auditing

#### updated_at
- Automatically updated to current UTC time on any modification
- Reflects last change timestamp
- Used for conflict detection and auditing

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| pk_task | id | Primary key lookup |
| ix_task_user_id | user_id | User-scoped queries |
| ix_task_created_at | created_at | Chronological sorting |

### Validation Rules

| Rule | Field(s) | Enforcement |
|------|----------|-------------|
| Title required | title | Database NOT NULL constraint |
| Title max length | title | Database VARCHAR(200) |
| Description max length | description | Database VARCHAR(1000) |
| User ID required | user_id | Database NOT NULL constraint |
| Completed default | completed | Database DEFAULT FALSE |

## Relationships

### Phase 2.1 (Current)
- **Task → User**: Logical reference only via user_id string
- No foreign key constraint (users table doesn't exist)
- user_id values are assumed valid

### Phase 2.2+ (Future)
- User entity will be introduced
- Foreign key constraint may be added
- Authentication will validate user_id values

## State Transitions

```
                    ┌─────────────┐
                    │   Created   │
                    │ completed=F │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Update  │ │  Toggle  │ │  Delete  │
        │  (title/ │ │ complete │ │  (removed│
        │  desc)   │ │          │ │  from DB)│
        └────┬─────┘ └────┬─────┘ └──────────┘
             │            │
             │            ▼
             │      ┌───────────────┐
             │      │   Completed   │
             │      │  completed=T  │
             │      └───────┬───────┘
             │              │
             │              │ Toggle again
             │              ▼
             │      ┌───────────────┐
             └─────►│  Incomplete   │
                    │  completed=F  │
                    └───────────────┘
```

## Data Access Operations

### Create
- Input: title, description (optional), user_id
- Output: Task with generated id, timestamps
- Sets: completed=False, created_at=now, updated_at=now

### Read (Single)
- Input: task_id
- Output: Task or None
- No user_id filter (ownership check is caller's responsibility)

### Read (List)
- Input: user_id (optional)
- Output: List of Tasks
- If user_id provided: filter by owner
- If user_id omitted: return all tasks

### Update
- Input: task_id, fields to update (title, description)
- Output: Updated Task or None
- Sets: updated_at=now
- Preserves: id, user_id, completed, created_at

### Delete
- Input: task_id
- Output: Boolean (success/not found)
- Removes task from database permanently

### Toggle Complete
- Input: task_id
- Output: Updated Task or None
- Flips: completed (True↔False)
- Sets: updated_at=now

## Migration Notes

### From Phase I (In-Memory)
| Phase I Field | Phase 2.1 Field | Change |
|---------------|-----------------|--------|
| id (int) | id (int) | No change |
| title (str) | title (str) | Max length added |
| description (str) | description (str) | Max length added |
| completed (bool) | completed (bool) | No change |
| — | user_id (str) | **New field** |
| — | created_at (datetime) | **New field** |
| — | updated_at (datetime) | **New field** |

### Breaking Changes
- user_id is now required on all operations
- Phase I console app must be updated to provide user_id (or use default)
