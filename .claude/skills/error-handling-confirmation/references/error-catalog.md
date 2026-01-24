# Error Code Catalog

Complete catalog of error codes, HTTP statuses, and user-facing messages.

---

## Authentication Errors (401)

| Code | Message | When |
|------|---------|------|
| `AUTH_REQUIRED` | "Please sign in to continue" | No auth token |
| `TOKEN_EXPIRED` | "Your session has expired. Please sign in again." | JWT expired |
| `TOKEN_INVALID` | "Invalid session. Please sign in again." | Malformed/tampered token |
| `TOKEN_MISSING_CLAIMS` | "Invalid session. Please sign in again." | Required claims missing |

**Implementation:**
```python
# FastAPI
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Please sign in to continue",
    headers={"WWW-Authenticate": "Bearer"}
)
```

```typescript
// Frontend handling
if (error.code === 'AUTH_REQUIRED' || error.code === 'TOKEN_EXPIRED') {
    redirectToSignIn();
}
```

---

## Authorization Errors (403)

| Code | Message | When |
|------|---------|------|
| `FORBIDDEN` | "You don't have permission to do this" | Generic permission denied |
| `RESOURCE_FORBIDDEN` | "You don't have access to this {resource}" | Specific resource |
| `ACTION_FORBIDDEN` | "You're not allowed to {action}" | Specific action |
| `ROLE_REQUIRED` | "This action requires {role} permissions" | Role-based access |

**Implementation:**
```python
# Check ownership before returning 403
if task.user_id != current_user_id:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have access to this task"
    )
```

---

## Not Found Errors (404)

| Code | Message | When |
|------|---------|------|
| `NOT_FOUND` | "{Resource} not found" | Generic not found |
| `TASK_NOT_FOUND` | "Task not found" | Specific task |
| `USER_NOT_FOUND` | "User not found" | Specific user |
| `ENDPOINT_NOT_FOUND` | "This page doesn't exist" | Invalid URL |

**Pattern for distinguishing 403 vs 404:**
```python
def get_resource(resource_id: int, user_id: str):
    resource = db.get(resource_id)

    if resource is None:
        # Truly doesn't exist
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.user_id != user_id:
        # Exists but not theirs - use 403, not 404
        raise HTTPException(status_code=403, detail="Access denied")

    return resource
```

---

## Validation Errors (400)

| Code | Message | When |
|------|---------|------|
| `VALIDATION_ERROR` | "Please check your input" | Generic validation |
| `REQUIRED_FIELD` | "{field} is required" | Missing required field |
| `INVALID_FORMAT` | "Please enter a valid {field}" | Format mismatch |
| `TOO_SHORT` | "{field} must be at least {min} characters" | Below minimum |
| `TOO_LONG` | "{field} must be less than {max} characters" | Above maximum |
| `INVALID_VALUE` | "{field} must be one of: {options}" | Invalid enum |
| `DUPLICATE` | "A {resource} with this {field} already exists" | Uniqueness violation |

**Field-level error structure:**
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Please check your input",
        "fields": {
            "title": "Title is required",
            "email": "Please enter a valid email address"
        }
    }
}
```

**Frontend display:**
```typescript
// Inline validation
<input className={errors.title ? 'border-red-500' : ''} />
{errors.title && (
    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
)}
```

---

## Server Errors (500)

| Code | Message | When |
|------|---------|------|
| `INTERNAL_ERROR` | "Something went wrong. Please try again." | Unhandled exception |
| `DATABASE_ERROR` | "Unable to save your changes. Please try again." | DB operation failed |
| `EXTERNAL_SERVICE_ERROR` | "A service we depend on is having issues." | Third-party failure |

**Never expose internal details:**
```python
# Bad
raise HTTPException(status_code=500, detail=str(e))  # Leaks internals

# Good
logger.error(f"Database error: {e}")  # Log for debugging
raise HTTPException(
    status_code=500,
    detail="Something went wrong. Please try again."
)
```

---

## Service Unavailable (503)

| Code | Message | When |
|------|---------|------|
| `SERVICE_UNAVAILABLE` | "Service temporarily unavailable. Please try again later." | Maintenance/overload |
| `DATABASE_UNAVAILABLE` | "We're having trouble connecting. Please try again." | DB connection failed |
| `RATE_LIMITED` | "Too many requests. Please wait a moment." | Rate limit exceeded |

**With retry guidance:**
```json
{
    "error": {
        "code": "RATE_LIMITED",
        "message": "Too many requests. Please wait a moment.",
        "retryAfter": 30
    }
}
```

---

## Network Errors (Client-Side)

| Code | Message | When |
|------|---------|------|
| `NETWORK_ERROR` | "Unable to connect. Please check your internet." | No network |
| `TIMEOUT` | "Request timed out. Please try again." | Request timeout |
| `OFFLINE` | "You appear to be offline." | Navigator.onLine false |

**Frontend handling:**
```typescript
try {
    await api.request();
} catch (error) {
    if (!navigator.onLine) {
        showError("You appear to be offline.");
    } else if (error.name === 'AbortError') {
        showError("Request timed out. Please try again.");
    } else {
        showError("Unable to connect. Please check your internet.");
    }
}
```

---

## Conflict Errors (409)

| Code | Message | When |
|------|---------|------|
| `CONFLICT` | "This {resource} was modified by someone else." | Concurrent edit |
| `ALREADY_EXISTS` | "A {resource} with this name already exists." | Duplicate creation |
| `STATE_CONFLICT` | "Can't {action} a {state} {resource}." | Invalid state transition |

**Example:**
```python
# Trying to complete an already-completed task
if task.completed:
    raise HTTPException(
        status_code=409,
        detail="This task is already completed"
    )
```

---

## Error Response Schema

### Standard Structure

```typescript
interface ErrorResponse {
    error: {
        code: string;           // Machine-readable: "VALIDATION_ERROR"
        message: string;        // Human-readable: "Please check your input"
        details?: {             // Optional additional context
            fields?: Record<string, string>;  // Field-level errors
            retryAfter?: number;              // Seconds to wait
            helpUrl?: string;                 // Link to help docs
        };
    };
}
```

### FastAPI Implementation

```python
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

class ErrorDetail(BaseModel):
    code: str
    message: str
    fields: Optional[Dict[str, str]] = None

class AppException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, fields: dict = None):
        detail = {"code": code, "message": message}
        if fields:
            detail["fields"] = fields
        super().__init__(status_code=status_code, detail=detail)

# Usage
raise AppException(
    status_code=400,
    code="VALIDATION_ERROR",
    message="Please check your input",
    fields={"title": "Title is required"}
)
```

### Frontend Error Handler

```typescript
function handleApiError(error: ApiError): string {
    const messages: Record<string, string> = {
        'AUTH_REQUIRED': 'Please sign in to continue',
        'TOKEN_EXPIRED': 'Your session has expired. Please sign in again.',
        'FORBIDDEN': "You don't have permission to do this",
        'NOT_FOUND': 'Not found',
        'VALIDATION_ERROR': 'Please check your input',
        'INTERNAL_ERROR': 'Something went wrong. Please try again.',
    };

    return messages[error.code] || error.message || 'An error occurred';
}
```
