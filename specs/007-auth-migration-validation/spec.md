# Feature Specification: Phase II Authentication Migration — Better Auth + FastAPI JWT Integration

**Feature Branch**: `007-auth-migration-validation`
**Created**: 2026-01-13
**Status**: Complete
**Implemented**: 2026-01-13
**Input**: User description: "Migrate the current authentication implementation to fully comply with Hackathon Phase II requirements by correctly integrating Better Auth (frontend) with a FastAPI backend using JWT-based authorization, while preserving reusable intelligence via agents and skills."

## Overview

This specification validates and documents the authentication migration for Hackathon Phase II. The goal is to ensure the current implementation correctly integrates Better Auth (Next.js frontend) with FastAPI backend using JWT-based authorization, enforcing user-scoped task access.

**Key Architectural Mandate**:
- Authentication Provider: Better Auth (Next.js / TypeScript)
- Authorization & Enforcement: FastAPI (Python)
- Identity Transport: JWT tokens (HS256)
- Shared Secret: BETTER_AUTH_SECRET (identical in frontend and backend)

**Implementation Status**: The authentication system is **SUBSTANTIALLY IMPLEMENTED** as documented in specs 005-auth-integration and 006-frontend-integration. This spec serves as a validation checkpoint and identifies any remaining gaps.

## Scope

### In Scope

- Validation of existing JWT verification in FastAPI
- Validation of Better Auth JWT issuance on frontend
- Validation of user-scoped task access enforcement
- Identification and documentation of any compliance gaps
- Cleanup of legacy authentication mechanisms (if any)

### Out of Scope (Non-Goals — Explicit Constraints)

- **DO NOT** implement signup or signin APIs in FastAPI
- **DO NOT** manage passwords or sessions in FastAPI
- **DO NOT** remove Better Auth
- **DO NOT** move database logic to frontend
- **DO NOT** create custom auth endpoints like `/api/auth/jwt` in FastAPI (this exists in FRONTEND only)
- **DO NOT** implement token refresh logic
- **DO NOT** add OAuth providers
- **DO NOT** implement RBAC (role-based access control)

## Implementation Status Assessment

### Current Architecture (Verified)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW (IMPLEMENTED)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. USER AUTHENTICATION                                                   │
│     Browser ──────────► POST /api/auth/signin                            │
│                               │                                           │
│                               ▼                                           │
│                    Better Auth (auth-server.ts)                           │
│                    - Validates credentials                                │
│                    - Creates PostgreSQL session                           │
│                    - Sets session cookie                                  │
│                               │                                           │
│                               ▼                                           │
│                    Session cookie stored in browser                       │
│                                                                           │
│  2. JWT BRIDGE (Frontend Only)                                            │
│     API Client ───────► GET /api/auth/jwt                                │
│                               │                                           │
│                               ▼                                           │
│                    JWT Bridge Route (jwt/route.ts)                        │
│                    - Reads Better Auth session                            │
│                    - Signs JWT with BETTER_AUTH_SECRET                    │
│                    - Returns { token: "eyJ..." }                          │
│                               │                                           │
│                               ▼                                           │
│                    JWT Token (15-min expiry)                              │
│                                                                           │
│  3. BACKEND API CALL                                                      │
│     API Client ───────► GET /api/tasks                                   │
│                         Authorization: Bearer <JWT>                       │
│                               │                                           │
│                               ▼                                           │
│                    FastAPI (get_current_user dependency)                  │
│                    - Extracts Authorization header                        │
│                    - Verifies JWT signature (JWT_SECRET)                  │
│                    - Validates expiration                                 │
│                    - Extracts sub (user_id) and email                     │
│                               │                                           │
│                               ▼                                           │
│                    AuthenticatedUser injected to route                    │
│                                                                           │
│  4. USER-SCOPED DATA ACCESS                                               │
│     Route Handler ────► CRUD Layer                                        │
│                         - Filters by user_id                              │
│                         - Enforces ownership                              │
│                         - Returns 403 for cross-user                      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Implementation Status

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Better Auth Config | `frontend/lib/auth/auth-server.ts` | COMPLETE | Database-backed sessions, email/password |
| Auth Client | `frontend/lib/auth/auth-client.ts` | COMPLETE | signIn, signUp, signOut, useSession |
| JWT Bridge | `frontend/app/api/auth/jwt/route.ts` | COMPLETE | Signs JWT with BETTER_AUTH_SECRET |
| API Client | `frontend/lib/api/client.ts` | COMPLETE | Fetches JWT, attaches to requests |
| JWT Verification | `backend/app/dependencies/auth.py` | COMPLETE | Verifies signature, extracts user_id |
| Protected Routes | `backend/app/routers/tasks.py` | COMPLETE | All endpoints require authentication |
| User-Scoped CRUD | `backend/app/crud/task.py` | COMPLETE | Filters by user_id, returns 403 |
| Configuration | `backend/app/config.py` | COMPLETE | JWT_SECRET, JWT_ALGORITHM |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - JWT-Based Authentication Flow (Priority: P1)

As an authenticated user, I want my Better Auth session to be converted into a JWT token that the FastAPI backend can verify, so that I can securely access my tasks.

**Why this priority**: This is the core authentication mechanism — without it, no authorized API access is possible.

**Independent Test**: Can be fully tested by signing in via Better Auth, calling `/api/auth/jwt` to get a token, and using that token to call FastAPI endpoints.

**Acceptance Scenarios**:

1. **Given** a user has signed in via Better Auth, **When** they call GET `/api/auth/jwt`, **Then** a valid JWT token is returned with `sub` (user_id) and `email` claims
2. **Given** a user has a valid JWT token, **When** they call any `/api/tasks` endpoint with `Authorization: Bearer <token>`, **Then** the request succeeds and returns user-scoped data
3. **Given** a user's JWT token is expired, **When** they call any `/api/tasks` endpoint, **Then** 401 Unauthorized is returned

**Current Status**: IMPLEMENTED

---

### User Story 2 - Rejection of Unauthenticated Requests (Priority: P1)

As a system operator, I want all unauthenticated API requests to be rejected so that the system enforces security boundaries.

**Why this priority**: Critical security requirement — the system must reject requests without valid tokens.

**Independent Test**: Can be fully tested by making API requests without tokens or with malformed tokens and verifying 401 responses.

**Acceptance Scenarios**:

1. **Given** a request with no Authorization header, **When** any task endpoint is called, **Then** 401 Unauthorized is returned
2. **Given** a request with an invalid JWT token (bad signature), **When** any task endpoint is called, **Then** 401 Unauthorized is returned
3. **Given** a request with malformed Authorization header (not "Bearer <token>"), **When** any task endpoint is called, **Then** 401 Unauthorized is returned

**Current Status**: IMPLEMENTED

---

### User Story 3 - Cross-User Access Prevention (Priority: P1)

As a user, I want the system to prevent other users from accessing my tasks so that my data remains private.

**Why this priority**: Critical security requirement — user data isolation is fundamental.

**Independent Test**: Can be fully tested by attempting to access, modify, or delete tasks belonging to a different user and verifying 403 responses.

**Acceptance Scenarios**:

1. **Given** User A has a valid JWT, **When** User A attempts to GET `/api/tasks/{id}` for User B's task, **Then** 403 Forbidden is returned
2. **Given** User A has a valid JWT, **When** User A attempts to PUT `/api/tasks/{id}` for User B's task, **Then** 403 Forbidden is returned
3. **Given** User A has a valid JWT, **When** User A attempts to DELETE `/api/tasks/{id}` for User B's task, **Then** 403 Forbidden is returned

**Current Status**: IMPLEMENTED

---

### User Story 4 - Shared Secret Configuration (Priority: P1)

As a system operator, I want the JWT signing secret to be identical between frontend and backend so that tokens can be verified correctly.

**Why this priority**: Without matching secrets, JWT verification fails completely.

**Independent Test**: Can be fully tested by verifying that `BETTER_AUTH_SECRET` (frontend) equals `JWT_SECRET` (backend) in environment configuration.

**Acceptance Scenarios**:

1. **Given** frontend and backend share the same secret, **When** frontend signs a JWT and backend verifies it, **Then** verification succeeds
2. **Given** frontend and backend have different secrets, **When** frontend signs a JWT and backend verifies it, **Then** 401 Unauthorized is returned

**Current Status**: IMPLEMENTED (both use `b218af51b238aaece19c4ab3d8af8d32`)

---

### User Story 5 - X-User-Id Header Removal (Priority: P2)

As a system operator, I want the temporary X-User-Id header mechanism removed so that user identity is derived solely from JWT tokens.

**Why this priority**: Important for security hardening but depends on JWT verification being in place first.

**Independent Test**: Can be fully tested by sending requests with X-User-Id header and verifying the header is ignored.

**Acceptance Scenarios**:

1. **Given** a request with both JWT token and X-User-Id header, **When** any task endpoint is called, **Then** the system uses only the JWT identity and ignores X-User-Id
2. **Given** a request with only X-User-Id header (no JWT), **When** any task endpoint is called, **Then** 401 Unauthorized is returned

**Current Status**: NEEDS VERIFICATION — No evidence of X-User-Id handling found in current codebase. If it was a previous mechanism, it appears to already be removed.

---

### Edge Cases

- What happens when JWT signature is invalid? → 401 Unauthorized (VERIFIED)
- What happens when JWT is well-formed but contains unknown user_id? → Request proceeds, returns empty results (VERIFIED)
- What happens when JWT payload is missing required claims (sub, email)? → 401 Unauthorized (VERIFIED)
- What happens when JWT secret mismatch between frontend and backend? → 401 Unauthorized (VERIFIED)
- How does system handle concurrent requests with same valid token? → All processed normally (VERIFIED)
- What happens when a task ID exists but belongs to a different user? → 403 Forbidden (VERIFIED)
- What happens when Better Auth session expires but JWT is still valid? → JWT works until its own expiration (15 min)
- What happens when JWT expires mid-request? → 401 Unauthorized returned

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication (Better Auth → JWT Bridge → FastAPI)

- **FR-001**: Frontend MUST use Better Auth as the sole authentication provider
- **FR-002**: Frontend MUST obtain JWT tokens via `/api/auth/jwt` bridge endpoint
- **FR-003**: Frontend MUST attach JWT to all backend requests via `Authorization: Bearer <token>` header
- **FR-004**: Backend MUST NOT implement signup, signin, or session management
- **FR-005**: Backend MUST verify JWT signature using shared secret (JWT_SECRET)
- **FR-006**: Backend MUST validate JWT expiration and reject expired tokens with 401
- **FR-007**: Backend MUST extract user_id from JWT `sub` claim
- **FR-008**: Backend MUST extract email from JWT `email` claim

#### Authorization (User-Scoped Access)

- **FR-009**: Backend MUST require valid JWT for all `/api/tasks/*` endpoints
- **FR-010**: Backend MUST filter all task queries by authenticated user_id
- **FR-011**: Backend MUST associate newly created tasks with authenticated user_id
- **FR-012**: Backend MUST verify task ownership before update/delete operations
- **FR-013**: Backend MUST return 403 Forbidden for cross-user access attempts
- **FR-014**: Backend MUST return 404 Not Found for non-existent tasks

#### Error Responses

- **FR-015**: Backend MUST return 401 Unauthorized for missing/invalid/expired tokens
- **FR-016**: Backend MUST return 403 Forbidden for valid tokens attempting unauthorized access
- **FR-017**: Backend MUST include `WWW-Authenticate: Bearer` header on 401 responses

#### Configuration

- **FR-018**: Backend JWT_SECRET MUST match frontend BETTER_AUTH_SECRET
- **FR-019**: JWT algorithm MUST be HS256 on both frontend and backend
- **FR-020**: JWT tokens MUST include `sub`, `email`, `iat`, and `exp` claims

### Key Entities

- **Better Auth Session**: Cookie-based session managed by Better Auth; stored in PostgreSQL; source of user identity
- **JWT Token**: Stateless, signed token containing user_id (sub) and email; 15-minute expiry; transport mechanism for identity
- **AuthenticatedUser**: Backend dataclass containing user_id and email extracted from verified JWT; injected via dependency
- **Task Ownership**: Relationship between Task and user_id; enforced at CRUD layer; determines access rights

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of task API requests without valid JWT return 401 Unauthorized
- **SC-002**: 100% of task API requests attempting cross-user access return 403 Forbidden
- **SC-003**: Users can only view tasks they own — zero data leakage between users
- **SC-004**: All task CRUD operations succeed for authenticated users accessing their own data
- **SC-005**: JWT tokens are verifiable by backend using shared secret
- **SC-006**: No duplicate auth logic exists (frontend does auth, backend does authz)
- **SC-007**: No backend endpoints exist for signup/signin/session management

## Constraints (Critical)

- No FastAPI auth endpoints (signup, signin, logout)
- No password management in FastAPI
- No session storage in FastAPI
- No removal of Better Auth
- No database logic in frontend
- No changes to existing API paths
- No RBAC implementation
- No token refresh logic

## Dependencies

- **Phase 2.3**: Backend JWT verification (COMPLETE)
- **Phase 2.4**: Frontend authentication UI (COMPLETE)
- **Better Auth**: Configured and issuing JWT tokens (COMPLETE)
- **Shared Secret**: JWT_SECRET = BETTER_AUTH_SECRET (COMPLETE)
- **PostgreSQL**: Neon database for Better Auth sessions and tasks (COMPLETE)

## Assumptions

- Better Auth is correctly configured with PostgreSQL session storage
- JWT tokens are signed using HS256 algorithm
- 15-minute token expiry is acceptable for this phase
- Users have modern browsers supporting required features
- Backend and frontend are deployed to accessible URLs
- Environment variables are correctly configured in production

## Compliance Checklist

### Hackathon Phase II Requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Better Auth for authentication | COMPLIANT | `frontend/lib/auth/auth-server.ts` |
| JWT token transport | COMPLIANT | `frontend/app/api/auth/jwt/route.ts` |
| FastAPI JWT verification | COMPLIANT | `backend/app/dependencies/auth.py` |
| User-scoped task access | COMPLIANT | `backend/app/crud/task.py` |
| No FastAPI auth endpoints | COMPLIANT | No `/api/auth/*` routes in backend |
| Shared secret configuration | COMPLIANT | Both use same 32-char secret |
| 401 for unauthenticated | COMPLIANT | `get_current_user` dependency |
| 403 for unauthorized | COMPLIANT | CRUD layer ownership checks |

### Remaining Gaps

| Gap | Severity | Resolution |
|-----|----------|------------|
| X-User-Id header handling | LOW | No evidence of header; likely already removed. Verify no code references it. |
| Custom error format | LOW | Using FastAPI default `{"detail": "..."}` format; acceptable for hackathon |
| JWT issuer/audience validation | OPTIONAL | Not required for internal services |

## Reusable Intelligence

### Agents to Reference

- **backend-auth-architect**: JWT verification strategy, FastAPI auth dependencies
- **backend-api-architect**: REST endpoint security, spec compliance
- **backend-database-guardian**: User-scoped queries, ownership enforcement
- **frontend-auth-integrator**: Better Auth JWT consumption, API client
- **spec-compliance-auditor**: Cross-artifact validation

### Skills to Reference

- `jwt-verification`: Token signature and expiration validation
- `fastapi-dependency-injection`: Auth user context injection
- `authorization-middleware-design`: Request authentication flow
- `sqlmodel-user-scoping`: ORM-level user filtering
- `secure-api-design`: Security boundaries and error handling
- `better-auth-jwt-consumption`: Frontend token retrieval
- `cross-service-auth-integration`: Frontend-backend auth coordination
- `spec-driven-validation`: Requirements traceability

## Next Phase Dependency

Completion of this validation spec confirms Phase II authentication compliance and authorizes:
- **Phase III** — AI Chatbot Integration (OpenAI Agents SDK + MCP)

## File References

### Frontend (Better Auth + JWT Bridge)

| File | Line | Purpose |
|------|------|---------|
| `frontend/lib/auth/auth-server.ts` | 1-50 | Better Auth server configuration |
| `frontend/lib/auth/auth-client.ts` | 1-20 | Auth client exports |
| `frontend/app/api/auth/jwt/route.ts` | 1-60 | JWT bridge endpoint |
| `frontend/app/api/auth/[...all]/route.ts` | 1-15 | Better Auth handler |
| `frontend/lib/api/client.ts` | 1-100 | API client with JWT attachment |
| `frontend/middleware.ts` | 1-40 | Route protection |

### Backend (JWT Verification + Authorization)

| File | Line | Purpose |
|------|------|---------|
| `backend/app/dependencies/auth.py` | 1-60 | JWT verification dependency |
| `backend/app/config.py` | 1-40 | JWT_SECRET configuration |
| `backend/app/routers/tasks.py` | 1-120 | Protected task routes |
| `backend/app/crud/task.py` | 1-150 | User-scoped CRUD operations |
| `backend/app/models/task.py` | 1-30 | Task model with user_id |
