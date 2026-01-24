# Claude Code Rules — Frontend Layer

AI-Based Todo Application frontend built with Next.js 15 and TypeScript.

**Inherits from**: Root `CLAUDE.md` (project-wide rules apply)

**Live URL**: `https://ai-based-todo.vercel.app`

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.4 | App Router, Server/Client Components |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.7.2 | Type-safe development (strict mode) |
| **Tailwind CSS** | 3.4.0 | Utility-first styling |
| **Better Auth** | 1.4.10 | Session management, authentication |
| **Jose** | 6.1.3 | JWT handling for API bridge |
| **Kysely** | 0.28.9 | Type-safe SQL for auth database |

## Directory Structure (Actual)

```
frontend/
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   │   └── auth/
│   │       ├── [...all]/route.ts  # Better Auth catch-all handler
│   │       └── jwt/route.ts       # JWT bridge route (CRITICAL)
│   ├── dashboard/page.tsx         # Protected task dashboard
│   ├── signin/page.tsx            # Sign in page
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Public landing page
│
├── components/
│   ├── ui/                        # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Motion.tsx             # Animation wrapper
│   └── tasks/                     # Task-specific components
│       ├── TaskList.tsx
│       ├── TaskItem.tsx
│       ├── TaskForm.tsx
│       └── EditTaskForm.tsx
│
├── hooks/
│   └── useTasks.ts                # Task CRUD hook with API client
│
├── lib/
│   ├── api/
│   │   └── client.ts              # API client (Bridge Pattern)
│   ├── auth/
│   │   └── auth-client.ts         # Better Auth client instance
│   └── config.ts                  # Environment configuration
│
├── types/
│   └── task.ts                    # Task type definitions
│
├── auth.ts                        # Better Auth server configuration
├── middleware.ts                  # Route protection middleware
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
└── package.json
```

## Boundary Rules

**This layer IS responsible for:**
- UI rendering with React Server/Client Components
- Client-side state management via hooks
- API client calls to FastAPI backend
- Authentication UI (signin, signout, session display)
- Route protection via middleware
- JWT bridge route (`/api/auth/jwt`)
- Form validation (client-side)

**This layer MUST NOT:**
- Access Neon database directly (except Better Auth tables)
- Implement business logic (backend responsibility)
- Generate JWT tokens client-side
- Store sensitive data in localStorage/sessionStorage
- Bypass the API client for backend calls
- Modify JWT verification logic

## Authentication Architecture

### JWT Bridge Pattern (DO NOT MODIFY)

```typescript
// lib/api/client.ts - Bridge Pattern Implementation
class ApiClient {
  private async getJWT(): Promise<string> {
    // Step 1: Call bridge route (includes Better Auth cookies)
    const response = await fetch('/api/auth/jwt', {
      credentials: 'include',  // REQUIRED for cookies
    })
    return (await response.json()).token
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    // Step 2: Get JWT from bridge
    const jwt = await this.getJWT()

    // Step 3: Call backend with Authorization header
    return fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${jwt}`,  // For FastAPI
        'Content-Type': 'application/json',
      },
    })
  }
}
```

### Middleware Protection

```typescript
// middleware.ts - Route protection
export function middleware(request: NextRequest) {
  // Check for Better Auth session cookies
  const regularToken = request.cookies.get('better-auth.session_token')
  const secureToken = request.cookies.get('__Secure-better-auth.session_token')
  const hasSession = !!(regularToken || secureToken)

  // Redirect unauthenticated users
  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect('/signin')
  }
}
```

### Public vs Protected Routes

| Route | Protection | Purpose |
|-------|------------|---------|
| `/` | Public | Landing page |
| `/signin` | Public | Authentication |
| `/signup` | Public | Registration |
| `/dashboard` | Protected | Task management |
| `/api/auth/*` | Public | Better Auth endpoints |
| `/api/auth/jwt` | Session Required | JWT bridge |

## API Client Usage

```typescript
// CORRECT: Always use the API client
import { apiClient } from '@/lib/api/client'

// In components or hooks
const tasks = await apiClient.getTasks()
const newTask = await apiClient.createTask({ title: 'New task' })
await apiClient.updateTask(id, { completed: true })
await apiClient.deleteTask(id)
await apiClient.toggleComplete(id)

// INCORRECT: Never bypass the client
const tasks = await fetch('http://backend/api/tasks')  // NO!
```

## Component Patterns

### Server vs Client Components

```typescript
// Server Component (default) - No 'use client'
// Good for: Static content, data fetching, SEO
export default async function DashboardPage() {
  return <TaskList />
}

// Client Component - Requires 'use client'
// Good for: Interactivity, hooks, event handlers
'use client'
export function TaskItem({ task }: { task: Task }) {
  const [isEditing, setIsEditing] = useState(false)
  // ...
}
```

### Hook Pattern

```typescript
// hooks/useTasks.ts
'use client'
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTasks()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  return { tasks, loading, error, fetchTasks, /* ... */ }
}
```

## Coding Conventions

### TypeScript

```typescript
// Always import types with 'type' keyword
import type { Task, TaskCreateRequest } from '@/types/task'

// Use explicit return types
async function createTask(data: TaskCreateRequest): Promise<Task> {
  return apiClient.createTask(data)
}

// Prefer type over interface for consistency
type TaskProps = {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (id: number) => void
}
```

### Tailwind CSS

```tsx
// Use utility classes directly
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Submit
</button>

// Use component abstraction for repeated patterns
<Button variant="primary" size="md">Submit</Button>
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | `TaskItem.tsx` |
| Hooks | camelCase.ts | `useTasks.ts` |
| Utilities | camelCase.ts | `config.ts` |
| Types | camelCase.ts | `task.ts` |
| Pages | page.tsx | `app/dashboard/page.tsx` |

## Key Commands

```bash
# Install dependencies
npm install

# Development (Turbopack - faster)
npm run dev

# Development (Webpack)
npm run dev:webpack

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Environment Variables

```bash
# .env.local (required)
NEXT_PUBLIC_API_URL=http://localhost:8000    # Backend URL
BETTER_AUTH_SECRET=<32-char-secret>          # Session encryption
DATABASE_URL=<neon-connection-string>        # For Better Auth tables

# Production (Vercel)
NEXT_PUBLIC_API_URL=https://todo-backend-xi-eosin.vercel.app
```

## Important Notes

### DO NOT Modify

1. **JWT Bridge Route** (`app/api/auth/jwt/route.ts`)
   - Converts Better Auth session to JWT
   - Backend depends on this exact format

2. **API Client** (`lib/api/client.ts`)
   - Bridge pattern implementation
   - All backend calls must go through this

3. **Middleware** (`middleware.ts`)
   - Cookie checking logic for both secure/non-secure
   - Route protection patterns

4. **Better Auth Config** (`auth.ts`)
   - Database adapter configuration
   - Session settings

### Session Handling

```typescript
// Check session in client components
'use client'
import { authClient } from '@/lib/auth/auth-client'

const { data: session } = await authClient.getSession()
if (!session) {
  // Redirect or show login
}

// Sign out
await authClient.signOut()
```

### Error Handling

```typescript
// Handle SESSION_INVALID from API client
try {
  const tasks = await apiClient.getTasks()
} catch (error) {
  if (error.message === 'SESSION_INVALID') {
    // Redirect to signin
    window.location.href = '/signin'
  }
}
```
