# Claude Code Rules — Frontend Layer

This file provides layer-specific context for the Evolution of Todo frontend application.

**Inherits from**: Root `CLAUDE.md` (project-wide rules apply)

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth (client-side integration)
- **State Management**: React hooks, Context API where needed

## Spec Referencing

All feature implementation must reference approved specifications:

```
@specs/features/<feature-name>/spec.md  — Requirements
@specs/features/<feature-name>/plan.md  — Architecture decisions
@specs/features/<feature-name>/tasks.md — Implementation tasks
@specs/ui/<component>/spec.md           — UI component specs
```

Before implementing any feature:
1. Read the relevant spec files
2. Verify task status in tasks.md
3. Follow the plan.md architecture

## Boundary Rules

**This layer is responsible for:**
- User interface rendering
- Client-side state management
- API client calls to backend
- Authentication UI flow (login, logout, session display)
- Form validation (client-side)

**This layer MUST NOT:**
- Access databases directly
- Implement business logic that belongs in backend
- Store sensitive data (tokens managed by Better Auth)
- Make direct database queries
- Bypass the backend API for data operations

## API Client Pattern

All backend communication goes through the API client layer:

```typescript
// Correct: Use API client
const tasks = await apiClient.tasks.list();

// Incorrect: Direct fetch without abstraction
const tasks = await fetch('/api/tasks');
```

## Authentication Integration

- Better Auth handles session management
- JWT tokens are managed by the auth library
- Protected routes use auth middleware
- User context available via auth hooks

## File Organization

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related routes
│   ├── (dashboard)/       # Protected routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and API client
│   ├── api/             # API client implementation
│   └── auth/            # Auth configuration
├── hooks/               # Custom React hooks
└── types/               # TypeScript type definitions
```

## Code Standards

- Use TypeScript strict mode
- Prefer server components where possible
- Client components marked with `'use client'`
- Follow React best practices for hooks
- Accessible components (ARIA attributes)
- Responsive design with Tailwind

## Phase Applicability

- **Phase 2.4+**: Frontend implementation begins
- **Current Phase (2.0)**: Governance only — no frontend code yet
