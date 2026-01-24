# Message Templates

Copy-paste templates for error messages, confirmations, and user feedback.

---

## Error Message Templates

### Authentication

```typescript
const AUTH_MESSAGES = {
    signInRequired: "Please sign in to continue",
    sessionExpired: "Your session has expired. Please sign in again.",
    invalidCredentials: "Invalid email or password",  // Same for both!
    accountLocked: "Account temporarily locked. Please try again in {minutes} minutes.",
    emailNotVerified: "Please verify your email to continue",
};
```

### Authorization

```typescript
const PERMISSION_MESSAGES = {
    accessDenied: "You don't have access to this {resource}",
    actionNotAllowed: "You're not allowed to {action}",
    roleRequired: "This requires {role} permissions",
    ownerOnly: "Only the owner can {action}",
};
```

### Validation

```typescript
const VALIDATION_MESSAGES = {
    required: "{field} is required",
    tooShort: "{field} must be at least {min} characters",
    tooLong: "{field} must be less than {max} characters",
    invalidEmail: "Please enter a valid email address",
    invalidUrl: "Please enter a valid URL",
    invalidPhone: "Please enter a valid phone number",
    invalidDate: "Please enter a valid date",
    invalidNumber: "Please enter a valid number",
    minValue: "{field} must be at least {min}",
    maxValue: "{field} must be at most {max}",
    pattern: "{field} format is invalid",
    unique: "This {field} is already taken",
    mismatch: "{field} doesn't match",
};
```

### Not Found

```typescript
const NOT_FOUND_MESSAGES = {
    generic: "{resource} not found",
    task: "Task not found",
    user: "User not found",
    page: "This page doesn't exist",
    searchNoResults: "No results found for \"{query}\"",
    emptyList: "No {resources} yet",
};
```

### Network & Server

```typescript
const NETWORK_MESSAGES = {
    offline: "You appear to be offline",
    connectionFailed: "Unable to connect. Please check your internet.",
    timeout: "Request timed out. Please try again.",
    serverError: "Something went wrong. Please try again.",
    serviceUnavailable: "Service temporarily unavailable. Please try again later.",
    rateLimited: "Too many requests. Please wait a moment.",
};
```

---

## Success Message Templates

### CRUD Operations

```typescript
const CRUD_SUCCESS = {
    created: "{resource} created successfully",
    updated: "Changes saved",
    deleted: "{resource} deleted",
    saved: "Saved",
};

// Examples
"Task created successfully"
"Changes saved"
"Task deleted"
```

### Task-Specific

```typescript
const TASK_SUCCESS = {
    completed: "Nice work! Task completed",
    reopened: "Task reopened",
    assigned: "Task assigned to {name}",
    priorityChanged: "Priority updated",
    dueDateSet: "Due date set to {date}",
};
```

### Bulk Operations

```typescript
const BULK_SUCCESS = {
    updated: "{count} items updated",
    deleted: "{count} items deleted",
    completed: "{count} tasks completed",
    moved: "{count} items moved to {destination}",
};

// Examples
"3 items updated"
"5 tasks completed"
```

### User Actions

```typescript
const USER_SUCCESS = {
    profileUpdated: "Profile updated",
    passwordChanged: "Password changed successfully",
    emailVerified: "Email verified",
    settingsSaved: "Settings saved",
    loggedOut: "You've been signed out",
};
```

---

## Empty State Messages

### Lists

```typescript
const EMPTY_STATES = {
    tasks: {
        all: {
            title: "No tasks yet",
            description: "Create your first task to get started",
            action: "Create task"
        },
        pending: {
            title: "All caught up!",
            description: "You've completed all your tasks",
            action: null
        },
        completed: {
            title: "No completed tasks",
            description: "Complete some tasks to see them here",
            action: null
        },
        search: {
            title: "No matching tasks",
            description: "Try adjusting your search or filters",
            action: "Clear filters"
        }
    }
};
```

### Search Results

```typescript
const SEARCH_EMPTY = {
    noResults: {
        title: "No results found",
        description: "Try different keywords or check your spelling",
    },
    noMatches: {
        title: "No matches for \"{query}\"",
        description: "Try broadening your search",
    }
};
```

---

## Confirmation Dialog Templates

### Destructive Actions

```typescript
const DELETE_CONFIRMATIONS = {
    task: {
        title: "Delete task?",
        message: "This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger"
    },
    account: {
        title: "Delete account?",
        message: "All your data will be permanently deleted. This cannot be undone.",
        confirmText: "Delete my account",
        cancelText: "Keep my account",
        variant: "danger"
    },
    bulk: {
        title: "Delete {count} items?",
        message: "This action cannot be undone.",
        confirmText: "Delete all",
        cancelText: "Cancel",
        variant: "danger"
    }
};
```

### Warning Actions

```typescript
const WARNING_CONFIRMATIONS = {
    unsavedChanges: {
        title: "Unsaved changes",
        message: "You have unsaved changes. Are you sure you want to leave?",
        confirmText: "Leave anyway",
        cancelText: "Stay",
        variant: "warning"
    },
    clearAll: {
        title: "Clear all?",
        message: "This will remove all items from the list.",
        confirmText: "Clear all",
        cancelText: "Cancel",
        variant: "warning"
    }
};
```

---

## Loading State Messages

```typescript
const LOADING_MESSAGES = {
    generic: "Loading...",
    saving: "Saving...",
    creating: "Creating...",
    deleting: "Deleting...",
    uploading: "Uploading...",
    processing: "Processing...",
    searching: "Searching...",
    connecting: "Connecting...",
};

// Button states
"Save" → "Saving..." → "Saved"
"Create" → "Creating..." → "Created"
"Delete" → "Deleting..." → "Deleted"
```

---

## Agent/Chatbot Messages

### Fallback Responses

```typescript
const CHATBOT_FALLBACKS = {
    notUnderstood: "I didn't quite catch that. Could you rephrase?",
    stillConfused: "I'm having trouble understanding. Here's what I can help with:",
    outOfScope: "I can't help with that, but I can assist you with:",
    errorOccurred: "Sorry, something went wrong. Let me try again.",
    needMoreInfo: "Could you provide more details about {topic}?",
};
```

### Confirmation Responses

```typescript
const CHATBOT_CONFIRMATIONS = {
    taskCreated: "Done! I've created the task \"{title}\"",
    taskCompleted: "Great job! \"{title}\" marked as complete",
    taskDeleted: "Task deleted",
    understood: "Got it! {summary}",
    processingRequest: "Working on that...",
};
```

### Clarification Requests

```typescript
const CHATBOT_CLARIFICATIONS = {
    whichOne: "I found multiple matches. Which one did you mean?",
    confirm: "Just to confirm, you want to {action}?",
    missingInfo: "I need a bit more info. What's the {field}?",
};
```

---

## Tone Guidelines

### Do Use

- **Friendly**: "Nice work!" not "Task status updated"
- **Clear**: "Please enter a valid email" not "Invalid input"
- **Actionable**: "Try again" not "Error occurred"
- **Concise**: "Saved" not "Your changes have been saved successfully"

### Don't Use

- **Technical jargon**: "ECONNREFUSED", "null pointer", "500 error"
- **Blame language**: "You failed to", "Your mistake"
- **Vague messages**: "Error", "Something happened"
- **ALL CAPS**: "ERROR: INVALID INPUT"
- **Excessive punctuation**: "Error!!!"

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Success | Celebratory | "Nice work! Task completed" |
| Error | Calm, helpful | "Unable to save. Please try again." |
| Warning | Clear, neutral | "You have unsaved changes" |
| Info | Friendly | "Tip: You can drag to reorder" |
| Destructive | Serious | "This cannot be undone" |

---

## Internationalization Notes

When localizing:

1. **Use placeholders**: `"{count} items"` not `"3 items"`
2. **Handle plurals**: `"{count} item(s)"` or use plural forms
3. **Avoid concatenation**: `"Hello " + name` breaks in some languages
4. **Consider length**: German/French often 30% longer than English
5. **Use ICU MessageFormat** for complex pluralization
