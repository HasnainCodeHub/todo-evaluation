# AI-Based Todo Application

Full-stack AI-powered task management application where AI commands handle all todo operations including creating, deleting, and updating tasks with complete authentication.

## Project Overview

**Evolution of Todo** is a production-grade full-stack application demonstrating:

- **AI-Driven Task Management**: All todos managed via AI commands through OpenAI Agents SDK
- **Complete Authentication**: Better Auth + JWT flow for secure user sessions
- **User-Scoped Data**: Each user sees only their own tasks
- **MCP Integration**: Model Context Protocol for tool execution and AI interactions
- **Spec-Driven Development**: Rigorous SDD workflow with specs, PHRs, and ADRs

**Live Deployments**:
- Frontend: `https://ai-based-todo.vercel.app`
- Backend: `https://todo-backend-xi-eosin.vercel.app`

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | App Router, Server/Client Components |
| **TypeScript** | Type-safe frontend development |
| **Tailwind CSS** | Utility-first styling |
| **Better Auth** | Session management, authentication UI |
| **ChatKit** | AI chat interface components |
| **Jose/JWT** | Token handling for API bridge |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python REST API |
| **Python 3.13+** | Backend language |
| **SQLModel** | ORM with Pydantic validation |
| **PyJWT** | JWT token verification |
| **OpenAI Agents SDK** | AI agent orchestration |

### Database & Infrastructure
| Technology | Purpose |
|------------|---------|
| **Neon PostgreSQL** | Serverless SQL database |
| **Kysely** | Type-safe SQL query builder (frontend) |
| **Vercel** | Deployment platform (both apps) |

### Authentication Flow
| Component | Role |
|-----------|------|
| **Better Auth** | Frontend session management |
| **JWT Bridge** | `/api/auth/jwt` converts session to JWT |
| **PyJWT** | Backend token verification |
| **MCP** | Model Context Protocol for AI tool calls |

### Future/Planned
| Technology | Purpose |
|------------|---------|
| **Dapr** | Distributed application runtime |
| **Kubernetes** | Container orchestration |
| **Docker** | Containerization |

## Directory Structure

```
todo-evaluation/
├── frontend/                      # Next.js 15 Application
│   ├── app/                       # App Router pages
│   │   ├── api/                   # API routes
│   │   │   └── auth/              # Auth endpoints
│   │   │       ├── [...all]/      # Better Auth catch-all
│   │   │       └── jwt/           # JWT bridge route
│   │   ├── (public)/              # Public pages (signin, home)
│   │   └── dashboard/             # Protected dashboard
│   ├── components/                # React components
│   │   ├── ui/                    # Base UI (Button, Card, Badge)
│   │   ├── tasks/                 # Task-specific components
│   │   └── auth/                  # Auth components
│   ├── hooks/                     # Custom hooks (useTasks)
│   ├── lib/                       # Utilities
│   │   ├── api/                   # API client (Bridge Pattern)
│   │   ├── auth/                  # Better Auth client
│   │   └── config.ts              # Environment config
│   ├── types/                     # TypeScript definitions
│   ├── middleware.ts              # Route protection
│   └── auth.ts                    # Better Auth server config
│
├── backend/                       # FastAPI Application
│   ├── app/
│   │   ├── main.py                # FastAPI entry point
│   │   ├── config.py              # Settings & environment
│   │   ├── database.py            # SQLModel engine
│   │   ├── models/                # SQLModel entities
│   │   │   └── task.py            # Task model
│   │   ├── routers/               # API endpoints
│   │   │   └── tasks.py           # Task CRUD routes
│   │   ├── schemas/               # Pydantic schemas
│   │   │   └── task.py            # Request/Response models
│   │   ├── crud/                  # Database operations
│   │   │   └── task.py            # Task CRUD functions
│   │   └── dependencies/          # FastAPI dependencies
│   │       └── auth.py            # JWT verification
│   ├── tests/                     # Pytest test files
│   └── requirements.txt           # Python dependencies
│
├── src/                           # CLI Application (Phase 1)
│   ├── cli.py                     # Click CLI commands
│   ├── main.py                    # CLI entry point
│   ├── task_model.py              # Task dataclass
│   └── task_store.py              # In-memory storage
│
├── .claude/                       # Claude Code Configuration
│   ├── agents/                    # 11 specialized agents
│   │   ├── chat-orchestrator.md   # MCP tool orchestration
│   │   ├── backend-api-architect.md
│   │   ├── frontend-app-architect.md
│   │   └── ...
│   ├── skills/                    # 22 domain skills
│   │   ├── mcp-tool-execution/    # MCP integration
│   │   ├── jwt-authentication/    # Auth patterns
│   │   ├── fastapi-architecture/  # Backend patterns
│   │   ├── nextjs-app-router/     # Frontend patterns
│   │   └── ...
│   └── commands/                  # Spec-Kit commands
│
├── specs/                         # Feature Specifications
│   ├── 001-cli-task-crud/         # CLI CRUD spec
│   ├── 002-repo-governance/       # Governance spec
│   ├── 003-db-persistence-layer/  # Database spec
│   ├── 004-backend-rest-api/      # API spec
│   ├── 005-auth-integration/      # Auth spec
│   └── 006-frontend-integration/  # Frontend spec
│
├── history/                       # Development History
│   ├── prompts/                   # Prompt History Records
│   └── adr/                       # Architecture Decisions
│
└── .specify/                      # Spec-Kit Plus Config
    ├── memory/                    # Constitution
    └── templates/                 # PHR/ADR templates
```

## Coding Conventions

### Python (Backend)

```python
# Type hints required on ALL functions
async def create_task(
    title: str,
    description: str | None,
    user_id: str
) -> Task:
    """Docstring required for public functions."""
    pass

# Pydantic schemas for request/response validation
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None

# SQLModel for database entities
class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    user_id: str = Field(index=True)

# FastAPI dependency injection for auth
@router.get("/tasks")
async def list_tasks(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return crud.get_tasks(user_id=current_user.user_id)

# Structured error responses
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication required",
    headers={"WWW-Authenticate": "Bearer"},
)
```

### TypeScript (Frontend)

```typescript
// Strict mode enabled - no implicit any
// Types imported from dedicated types/ directory
import type { Task, TaskCreateRequest } from '@/types/task'

// API client class pattern with Bridge authentication
class ApiClient {
  private async getJWT(): Promise<string> {
    // Always use bridge route, never generate JWT client-side
    const response = await fetch('/api/auth/jwt', {
      credentials: 'include',
    })
    return (await response.json()).token
  }

  async createTask(data: TaskCreateRequest): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// React components: Server by default, 'use client' when needed
// Custom hooks for data fetching
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  // ...
}
```

### API Design

```
# RESTful endpoints at /api/tasks
GET    /api/tasks           # List user's tasks
POST   /api/tasks           # Create task
GET    /api/tasks/{id}      # Get specific task
PUT    /api/tasks/{id}      # Update task
DELETE /api/tasks/{id}      # Delete task
PATCH  /api/tasks/{id}/complete  # Toggle completion

# Authentication header
Authorization: Bearer <jwt_token>

# Error response format
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### File Naming

- **Python**: `snake_case.py` (task_model.py, task_store.py)
- **TypeScript**: `camelCase.ts` for utilities, `PascalCase.tsx` for components
- **Components**: `PascalCase.tsx` (EditTaskForm.tsx, LoadingSpinner.tsx)

## Key Commands

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Development server (Turbopack)
npm run dev

# Development server (Webpack)
npm run dev:webpack

# Production build
npm run build

# Start production server
npm start

# Lint check
npm run lint
```

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Run with custom host/port
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### CLI Application (Phase 1)

```bash
cd src

# Run CLI
python main.py

# CLI commands
python cli.py add "Task title"
python cli.py list
python cli.py complete <task_id>
python cli.py delete <task_id>
```

### Environment Setup

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=<secret>
DATABASE_URL=<neon_connection_string>

# Backend (.env)
DATABASE_URL=<neon_connection_string>
JWT_SECRET=<shared_secret>
JWT_ALGORITHM=HS256
```

### Deployment (Vercel)

```bash
# Deploy frontend
cd frontend && vercel --prod

# Deploy backend
cd backend && vercel --prod
```

## Important Notes

### DO NOT Modify Skill/Agent Patterns

The `.claude/skills/` and `.claude/agents/` directories contain carefully designed patterns that power AI-driven development. **DO NOT change the coding methods from which these skills and agents are built.**

**Protected patterns include**:

1. **MCP Tool Execution** (`.claude/skills/mcp-tool-execution/`)
   - Tool registration and validation
   - Deterministic execution flow
   - Error handling patterns

2. **Chat Orchestrator** (`.claude/agents/chat-orchestrator.md`)
   - Intent interpretation
   - Tool chaining logic
   - Confirmation policies

3. **Authentication Skills** (`.claude/skills/jwt-*/`, `.claude/skills/better-auth-*/`)
   - JWT verification flow
   - Better Auth integration
   - Bridge pattern implementation

4. **API Architecture** (`.claude/skills/fastapi-architecture/`, `.claude/skills/rest-api-design/`)
   - Router organization
   - Dependency injection patterns
   - Error response formats

### Critical Architecture Rules

1. **Never bypass the JWT Bridge**
   - Frontend must always call `/api/auth/jwt` to get tokens
   - Never generate JWT client-side
   - Never pass user_id in headers manually

2. **User-scoped data is mandatory**
   - All CRUD operations MUST include `user_id` filtering
   - Never allow cross-user data access

3. **Follow existing patterns**
   - New endpoints follow the existing router pattern
   - New components follow the existing hook pattern
   - New schemas follow the existing Pydantic pattern

4. **Spec-Driven Development**
   - Read specs before implementing features
   - Create PHRs after completing work
   - Suggest ADRs for significant decisions

### Authentication Flow (Do Not Alter)

```
Browser → Better Auth (Session Cookie)
       → /api/auth/jwt (Bridge Route)
       → JWT Token
       → Authorization: Bearer <token>
       → FastAPI Backend
       → PyJWT Verification
       → AuthenticatedUser Dependency
       → User-Scoped Data Access
```

### Environment Variables (Required)

| Variable | Layer | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |
| `BETTER_AUTH_SECRET` | Frontend | Session encryption |
| `DATABASE_URL` | Both | Neon PostgreSQL connection |
| `JWT_SECRET` | Both | JWT signing/verification |
| `JWT_ALGORITHM` | Backend | HS256 (do not change) |

### PHR Routing (Automatic)

All Prompt History Records route to `history/prompts/`:
- Constitution changes → `history/prompts/constitution/`
- Feature work → `history/prompts/<feature-name>/`
- General work → `history/prompts/general/`

## Active Technologies
- Python 3.13+ (based on project requirements) + Official MCP SDK, SQLModel, Neon PostgreSQL, PyJWT for authentication (008-mcp-server)
- Neon PostgreSQL database for persistent task storage (008-mcp-server)

## Recent Changes
- 008-mcp-server: Added Python 3.13+ (based on project requirements) + Official MCP SDK, SQLModel, Neon PostgreSQL, PyJWT for authentication
