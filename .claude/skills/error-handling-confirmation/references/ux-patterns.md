# UX Patterns for Error Handling & Confirmations

Visual and interaction patterns for error states and success feedback.

---

## Feedback Hierarchy

Choose the right feedback mechanism based on importance and context:

```
Severity/Importance
        ↑
   [Modal Dialog]     - Blocking, requires action (delete confirmation)
        │
   [Inline Alert]     - Persistent, in-context (form errors)
        │
   [Toast/Snackbar]   - Transient, non-blocking (success messages)
        │
   [Status Indicator] - Subtle, ambient (connection status)
        ↓
```

---

## Toast/Snackbar Patterns

### When to Use
- Success confirmations
- Non-critical errors
- Background operation results
- Notifications that don't need action

### Implementation

```typescript
interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;  // Auto-dismiss time (ms)
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Usage examples
addToast({ message: "Task created", type: "success" });
addToast({ message: "Unable to save", type: "error", duration: 6000 });
addToast({
    message: "Task deleted",
    type: "success",
    action: { label: "Undo", onClick: undoDelete }
});
```

### Visual Design

```
┌──────────────────────────────────────────┐
│ ✓  Task created successfully         ✕  │
│    ══════════════════════════════        │  ← Progress bar
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ⚠  Unable to save changes            ✕  │
│    Please try again                      │
└──────────────────────────────────────────┘
```

### Positioning
- **Bottom-right**: Non-critical notifications
- **Top-center**: Important alerts
- **Bottom-center**: Mobile-friendly

### Timing
- **Success**: 3-4 seconds
- **Info**: 4-5 seconds
- **Warning**: 5-6 seconds
- **Error**: 6+ seconds or manual dismiss

---

## Inline Error Patterns

### Form Field Errors

```
┌─────────────────────────────────────────┐
│ Email                                    │
├─────────────────────────────────────────┤
│ john@example                      ✕     │  ← Red border
└─────────────────────────────────────────┘
  ⚠ Please enter a valid email address     ← Error below field

```

### Implementation

```tsx
// React pattern
<div className="form-field">
    <label htmlFor="email">Email</label>
    <input
        id="email"
        type="email"
        value={email}
        onChange={handleChange}
        className={error ? 'border-red-500' : 'border-gray-300'}
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
    />
    {error && (
        <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
            <WarningIcon className="inline mr-1" />
            {error}
        </p>
    )}
</div>
```

### Validation Timing
- **On blur**: After user leaves field
- **On submit**: When form submitted
- **Real-time**: Only for specific cases (password strength)

### Character Count with Limit

```
┌─────────────────────────────────────────┐
│ Description                              │
├─────────────────────────────────────────┤
│ This is my task description...          │
│                                         │
└─────────────────────────────────────────┘
                              180/200 chars  ← Normal
                              195/200 chars  ← Warning (yellow)
                              205/200 chars  ← Error (red)
```

---

## Modal/Dialog Patterns

### Confirmation Dialog

```
┌─────────────────────────────────────────────┐
│  ⚠️  Delete task?                           │
├─────────────────────────────────────────────┤
│                                             │
│  This action cannot be undone.              │
│                                             │
│  Task: "Complete quarterly report"          │
│                                             │
├─────────────────────────────────────────────┤
│              [Cancel]  [Delete]             │
└─────────────────────────────────────────────┘
```

### Implementation

```tsx
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
}

// Keyboard handling
- Escape: Close dialog
- Enter: Confirm (careful with destructive!)
- Tab: Trap focus within dialog
```

### Variant Colors

| Variant | Use Case | Confirm Button |
|---------|----------|----------------|
| `danger` | Delete, destructive | Red |
| `warning` | Potentially risky | Orange/Amber |
| `primary` | Normal confirmation | Blue/Primary |

---

## Empty State Patterns

### No Items

```
        ┌─────────────────┐
        │                 │
        │    📋          │
        │                 │
        └─────────────────┘

         No tasks yet

    Create your first task to
         get started

        [+ Create task]
```

### No Results

```
        ┌─────────────────┐
        │                 │
        │    🔍          │
        │                 │
        └─────────────────┘

    No results for "meeting"

    Try different keywords or
       check your spelling

        [Clear search]
```

### All Done

```
        ┌─────────────────┐
        │                 │
        │    🎉          │
        │                 │
        └─────────────────┘

         All caught up!

    You've completed all your
            tasks

```

---

## Loading State Patterns

### Button Loading

```
[Create task]  →  [⟳ Creating...]  →  [✓ Created]
                      ↓
              Disabled during load
```

### Skeleton Loading

```
┌─────────────────────────────────────────┐
│ ████████████████                        │
│ █████████████████████████████           │
│ ████████████                            │
└─────────────────────────────────────────┘
```

### Full-Page Loading

```
        ┌─────────────────┐
        │                 │
        │       ⟳        │
        │                 │
        └─────────────────┘

          Loading...
```

---

## Error Boundary Patterns

### Component Error

```
┌─────────────────────────────────────────┐
│  ⚠️  Something went wrong               │
├─────────────────────────────────────────┤
│                                         │
│  This section couldn't load properly.   │
│                                         │
│           [Try again]                   │
│                                         │
└─────────────────────────────────────────┘
```

### Full-Page Error

```
        ┌─────────────────┐
        │                 │
        │       ⚠️       │
        │                 │
        └─────────────────┘

    Something went wrong

  We're working on fixing this.
      Please try again.

    [Refresh page]  [Go home]
```

### Implementation

```tsx
class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
        }
        return this.props.children;
    }
}
```

---

## Animation Patterns

### Success Animation

```tsx
// Checkmark animation sequence
1. Circle scales in (0 → 100%)
2. Checkmark draws (stroke-dashoffset animation)
3. Brief pause
4. Fade out (optional)

// CSS
@keyframes checkmark {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
}
```

### Error Shake

```tsx
// Shake animation for invalid input
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.error-shake {
    animation: shake 0.3s ease-in-out;
}
```

### Toast Slide-In

```tsx
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

---

## Accessibility Considerations

### ARIA Attributes

```tsx
// Error message
<p role="alert" aria-live="assertive">
    Please enter a valid email
</p>

// Success message
<p role="status" aria-live="polite">
    Task created successfully
</p>

// Invalid input
<input aria-invalid="true" aria-describedby="error-message" />
```

### Focus Management

```tsx
// After error, focus first invalid field
useEffect(() => {
    if (errors.length > 0) {
        const firstErrorField = document.querySelector('[aria-invalid="true"]');
        firstErrorField?.focus();
    }
}, [errors]);

// After modal close, return focus to trigger
const triggerRef = useRef();
// ... when modal closes:
triggerRef.current?.focus();
```

### Color Independence

Don't rely on color alone:
- ✅ Red color + warning icon + error text
- ❌ Just red border (colorblind users miss it)

---

## Mobile Considerations

### Toast Positioning
- Bottom of screen (thumb-reachable)
- Above bottom navigation if present
- Swipe to dismiss

### Touch Targets
- Minimum 44x44px for action buttons
- Adequate spacing between options

### Keyboard Handling
- Don't cover form with toast while typing
- Position errors above field (keyboard won't cover)

---

## Dark Mode Adaptations

```css
/* Light mode */
.toast-success { background: #dcfce7; color: #166534; }
.toast-error { background: #fee2e2; color: #991b1b; }

/* Dark mode */
.dark .toast-success { background: #166534; color: #dcfce7; }
.dark .toast-error { background: #991b1b; color: #fee2e2; }
```

Ensure sufficient contrast in both modes (WCAG AA: 4.5:1 for text).
