# Evolution of Todo - System Architecture

## Architecture Overview

Evolution of Todo follows a layered monorepo architecture with clear separation between frontend, backend, and specifications.

## System Layers

### Layer 1: Frontend (Phase 2.4+)

**Technology Stack**:
- Next.js 14+ with App Router
- React 18+ with Server Components
- TypeScript
- Tailwind CSS

**Location**: `/frontend`

**Responsibilities**:
- User interface rendering
- Client-side state management
- API communication via typed clients
- Authentication UI (Better Auth)

### Layer 2: Backend (Phase 2.3+)

**Technology Stack**:
- Python 3.13+
- FastAPI
- SQLModel (ORM)
- Neon Serverless PostgreSQL

**Location**: `/backend`

**Responsibilities**:
- RESTful API endpoints
- Business logic
- Database operations
- JWT verification
- Data validation

### Layer 3: Console App (Phase I - Preserved)

**Technology Stack**:
- Python 3.13+
- In-memory storage

**Location**: `/src`

**Responsibilities**:
- CLI task management
- In-memory CRUD operations
- Interactive menu interface

**Note**: This layer is preserved for reference and must not be modified.

## Data Flow

```
┌─────────────┐     HTTP/JSON     ┌─────────────┐     SQL      ┌─────────────┐
│   Frontend  │ ◄───────────────► │   Backend   │ ◄──────────► │  Database   │
│  (Next.js)  │                   │  (FastAPI)  │              │   (Neon)    │
└─────────────┘                   └─────────────┘              └─────────────┘
       │                                 │
       │ Better Auth                     │ JWT Verification
       ▼                                 ▼
┌─────────────┐                   ┌─────────────┐
│    Auth     │                   │   Claims    │
│   Provider  │                   │  Validator  │
└─────────────┘                   └─────────────┘
```

## Authentication Architecture

**Phase 2.2+**:
- Frontend: Better Auth for user authentication
- Backend: JWT verification for API protection
- User isolation: Tasks scoped to authenticated user

## Database Architecture

**Phase 2.1+**:
- Provider: Neon Serverless PostgreSQL
- ORM: SQLModel
- Migrations: Managed via SQLModel/Alembic

### Core Entities

| Entity | Description | Owner |
|--------|-------------|-------|
| User | Authenticated user | Auth system |
| Task | Todo item with title, description, status | User |

### Relationships

- User → Tasks: One-to-Many (user owns tasks)
- Tasks are scoped: Users can only access their own tasks

## API Architecture

**Phase 2.3+**:
- Style: RESTful
- Format: JSON
- Authentication: JWT Bearer tokens
- Base path: `/api/v1`

### Endpoint Groups

| Group | Path | Description |
|-------|------|-------------|
| Tasks | `/api/v1/tasks` | Task CRUD operations |
| Auth | `/api/v1/auth` | Authentication endpoints |
| Health | `/api/v1/health` | Health check |

## Security Boundaries

### Frontend Boundary
- Handles user authentication via Better Auth
- Does NOT store sensitive tokens in localStorage
- Uses httpOnly cookies for session management

### Backend Boundary
- Validates JWT tokens on every protected request
- Enforces user isolation at data layer
- Never trusts frontend for authorization decisions

## Spec Organization

All specifications live under `/specs`:

```
specs/
├── overview.md       # Project overview (this context)
├── architecture.md   # This file
├── features/         # Feature specifications
│   └── [feature]/
│       └── spec.md
├── api/              # API specifications
│   └── [endpoint]/
│       └── spec.md
├── database/         # Database specifications
│   └── schema.md
└── ui/               # UI specifications
    └── [component]/
        └── spec.md
```

## Evolution Path

```
Phase I      ─► Phase 2.0    ─► Phase 2.1    ─► Phase 2.2    ─► Phase 2.3    ─► Phase 2.4
Console App     Governance      Database        Auth            API             Frontend
(Complete)      (In Progress)   (Pending)       (Pending)       (Pending)       (Pending)
```

Each phase builds on the previous, maintaining backward compatibility and preserving earlier functionality.

## Constitution Compliance

All architecture decisions must comply with `.specify/memory/constitution.md`:

- Phase-appropriate technologies only
- No future-phase tech in current phase
- Spec-driven development mandatory
- No manual coding (Claude Code executor only)
