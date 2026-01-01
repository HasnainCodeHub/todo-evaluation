# Feature Specification: Database Persistence Layer

**Feature Branch**: `003-db-persistence-layer`
**Created**: 2026-01-01
**Status**: Draft
**Phase**: 2.1
**Input**: User description: "Phase 2.1 — Replace in-memory task storage with persistent PostgreSQL storage using SQLModel ORM"

## Overview

Phase 2.1 replaces the Phase I in-memory task storage with persistent storage using Neon Serverless PostgreSQL and SQLModel. This phase introduces database models, connections, and data access patterns only. No REST API, authentication enforcement, or frontend integration is permitted in this phase.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Task Persistence Across Sessions (Priority: P1)

As a system operator, I need tasks to persist in a database so that data survives application restarts and can be accessed reliably.

**Why this priority**: Without persistence, all Phase II+ features are blocked. This is the foundational capability that enables multi-user web access.

**Independent Test**: Can be fully tested by creating tasks, restarting the application, and verifying tasks are still retrievable. Delivers durable data storage.

**Acceptance Scenarios**:

1. **Given** a task is created with title "Buy groceries", **When** the application restarts, **Then** the task is retrievable from the database with all its properties intact
2. **Given** multiple tasks exist in the database, **When** the data access layer queries for all tasks, **Then** all tasks are returned with correct data
3. **Given** a task is updated in one session, **When** queried in a new session, **Then** the updated values are reflected

---

### User Story 2 - User-Scoped Task Ownership (Priority: P1)

As a data architect, I need tasks to be associated with user identifiers so that future phases can enforce user isolation and ownership.

**Why this priority**: User ownership is required for Phase 2.2+ multi-user support. Without user_id fields, data isolation is impossible.

**Independent Test**: Can be tested by creating tasks with different user_id values and verifying queries filter correctly by owner.

**Acceptance Scenarios**:

1. **Given** tasks exist for user_id "user-123" and "user-456", **When** querying tasks for "user-123", **Then** only tasks belonging to "user-123" are returned
2. **Given** a new task is created, **When** user_id is provided, **Then** the task is stored with that user_id association
3. **Given** a task query without user_id filter, **When** executed, **Then** all tasks are returned (admin/debug use case)

---

### User Story 3 - CRUD Operations at Data Access Layer (Priority: P1)

As a developer, I need complete Create, Read, Update, Delete operations at the data access layer so that higher layers can manage tasks without knowing database details.

**Why this priority**: CRUD operations are the core interface between business logic and storage. All features depend on these operations.

**Independent Test**: Can be tested by executing each CRUD operation and verifying database state changes correctly.

**Acceptance Scenarios**:

1. **Given** valid task data, **When** create operation is called, **Then** a new task with auto-generated ID is stored and returned
2. **Given** an existing task, **When** update operation is called with new title, **Then** the task's title is updated and timestamps reflect the change
3. **Given** an existing task, **When** delete operation is called, **Then** the task is removed from the database
4. **Given** a task ID, **When** read operation is called, **Then** the complete task data is returned or an appropriate error if not found

---

### User Story 4 - Database Connection Management (Priority: P2)

As a system operator, I need reliable database connection handling so that the application connects to Neon PostgreSQL correctly and handles connection lifecycle.

**Why this priority**: Connection management is infrastructure-level. Core CRUD must work first, then connection robustness follows.

**Independent Test**: Can be tested by verifying connection establishment, query execution, and graceful handling of connection issues.

**Acceptance Scenarios**:

1. **Given** valid database credentials in environment, **When** application starts, **Then** database connection is established successfully
2. **Given** database operations complete, **When** session ends, **Then** connections are properly closed/returned to pool
3. **Given** invalid credentials, **When** connection is attempted, **Then** a clear error message is provided without exposing sensitive details

---

### Edge Cases

- What happens when a task with non-existent ID is queried? → Return None or appropriate "not found" response
- What happens when user_id is empty string? → Treat as valid (validation is Phase 2.2+ concern)
- What happens when database is temporarily unavailable? → Raise appropriate exception with context
- What happens when task title exceeds maximum length? → Database constraint enforces limit, raise validation error
- What happens when duplicate task creation is attempted? → Allow (no unique constraints on title/description)

## Requirements *(mandatory)*

### Functional Requirements

**Data Model:**
- **FR-001**: System MUST define a Task entity with fields: id (auto-generated integer), title (string, required), description (string, optional), completed (boolean, default false), user_id (string, required), created_at (datetime, auto-generated), updated_at (datetime, auto-updated)
- **FR-002**: System MUST use SQLModel as the ORM for all database operations
- **FR-003**: System MUST NOT create a users table in this phase (user_id is a string reference only)

**Data Access:**
- **FR-004**: System MUST provide a create_task function that accepts task data and user_id, returns the created task with generated ID
- **FR-005**: System MUST provide a get_task function that retrieves a single task by ID
- **FR-006**: System MUST provide a get_tasks function that retrieves all tasks, optionally filtered by user_id
- **FR-007**: System MUST provide an update_task function that modifies existing task properties
- **FR-008**: System MUST provide a delete_task function that removes a task by ID
- **FR-009**: System MUST provide a toggle_complete function that flips the completed status of a task

**Database Connection:**
- **FR-010**: System MUST read database connection string from environment variable
- **FR-011**: System MUST support Neon Serverless PostgreSQL as the database backend
- **FR-012**: System MUST provide a function to initialize database tables on first run

**Constraints:**
- **FR-013**: System MUST NOT include any REST API endpoints or HTTP handling
- **FR-014**: System MUST NOT include JWT verification or authentication logic
- **FR-015**: System MUST NOT include any frontend code or UI components
- **FR-016**: System MUST NOT use raw SQL queries (SQLModel/SQLAlchemy abstractions only)
- **FR-017**: System MUST NOT implement database migrations (simple table creation only)

### Key Entities

- **Task**: Represents a todo item. Contains id, title, description, completed status, owner reference (user_id), and timestamps. This is the only entity in Phase 2.1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All task data persists across application restarts (100% data durability)
- **SC-002**: CRUD operations complete successfully for all valid inputs
- **SC-003**: Tasks can be filtered by user_id with correct isolation (zero cross-user data leakage)
- **SC-004**: Database connection establishes within 5 seconds on application start
- **SC-005**: Phase I functionality is logically preserved (same 5 operations: add, view, update, delete, toggle complete)
- **SC-006**: Zero REST API endpoints exist in codebase after Phase 2.1
- **SC-007**: Zero authentication/authorization code exists in codebase after Phase 2.1

## Scope Boundaries

### In Scope
- SQLModel model definitions
- Database connection configuration
- Table creation logic
- Data-access functions for tasks
- User ownership fields (logical, not authenticated)

### Out of Scope
- REST API endpoints
- JWT verification
- Better Auth integration
- Frontend UI
- Database migrations (Alembic)
- Advanced features (tags, due dates, reminders)
- User authentication or session management

## Assumptions

- Neon PostgreSQL database is provisioned and accessible
- Database credentials will be provided via environment variables
- User IDs are strings provided by calling code (validation deferred to Phase 2.2+)
- Phase I console app code in `/src` remains unchanged (this phase creates parallel backend structure)
- SQLModel and required dependencies will be added to project

## Dependencies

- **Phase 2.0**: Repository structure must be in place (backend/ directory exists)
- **External**: Neon PostgreSQL instance must be available
- **Libraries**: SQLModel, asyncpg (or psycopg for sync), python-dotenv

## Next Phase

Completion of Phase 2.1 authorizes: **Phase 2.2 — Backend REST API Layer**
