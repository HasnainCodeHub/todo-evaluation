# Data Model: MCP Server Task Management

## Entity: Task

### Attributes
- **id**: Integer (Primary Key, Auto-generated)
- **user_id**: String (Required, Indexed for scoping)
- **title**: String (Required, 1-200 characters)
- **description**: String (Optional, 0-1000 characters)
- **completed**: Boolean (Default: False)
- **created_at**: DateTime (Auto-generated on creation)
- **updated_at**: DateTime (Auto-generated on update)

### Relationships
- None (self-contained entity with user_id for scoping)

### Validation Rules
- user_id: Required, non-empty string for user identification
- title: Required, 1-200 characters, trimmed whitespace
- description: Optional, 0-1000 characters, trimmed whitespace
- completed: Boolean value, default false

### State Transitions
- New Task: created with completed=False
- Complete Task: transition from completed=False to completed=True (idempotent)
- Update Task: modify title/description, update updated_at timestamp
- Delete Task: permanent removal from database

## Entity: Error Object

### Attributes
- **error**: Object containing:
  - **code**: String (machine-readable error code)
  - **message**: String (human-readable error message)
  - **details**: Object (optional additional error information)

## Entity: User Context

### Attributes
- **user_id**: String (extracted from JWT claims)
- **authenticated**: Boolean (validation status)
- **permissions**: List (scoped operations allowed)