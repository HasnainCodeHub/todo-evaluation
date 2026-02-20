# Feature Specification: MCP Server for AI Task Management

**Feature Branch**: `008-mcp-server`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "phase-3-mcp-server

Objective:
Specify the MCP Server for Phase 3 (Basic Level) of the Todo AI system.
The MCP Server must expose stateless task-management tools that can be
invoked by AI agents using the Official MCP SDK. The MCP Server is the
only component allowed to mutate task-related state.

Scope:
- MCP Server implementation only
- Exposure of task operations as MCP tools
- Stateless tool execution with database-backed persistence
- No conversational logic
- No frontend or ChatKit concerns
Out of Scope:
- Chat orchestration or natural language reasoning
- FastAPI chat endpoint design
- Frontend UI or authentication flows
- Advanced memory, embeddings, or streaming

Architecture Constraints:
- MCP tools must be stateless and deterministic
- MCP Server must NEVER store in-memory state
- All state must be persisted in the database
- Tools must enforce strict user_id scoping
- MCP Server must not perform natural language reasoning
Agent:
- mcp-server-agent

Agent Responsibilities:
- Define and register MCP tools using the Official MCP SDK
- Execute tool calls deterministically
- Persist task state to the database
- Validate tool inputs and ownership
- Return structured, predictable tool outputs
- Normalize and handle tool-level errors

MCP Tools to Expose:
1. add_task
   - Create a new task for a user
2. list_tasks
   - Retrieve tasks by status (all, pending, completed)

3. complete_task
   - Mark a task as completed

4. delete_task
   - Remove a task

5. update_task
   - Update task title and/or description

Data Models:
- Task:
  user_id, id, title, description, completed, created_at, updated_at

Behavioral Requirements:
- Tools must reject invalid or unauthorized operations
- Task-not-found cases must be handled gracefully
- Tool outputs must be structured and machine-readable
- No side effects beyond defined database mutations
Acceptance Criteria:
- All task operations are accessible only via MCP tools
- Tools behave consistently across repeated calls
- MCP Server remains stateless across requests
- Database state is the single source of truth"

## Clarifications

### Session 2026-01-29

- Q: What error response format should the MCP tools return for failed operations? → A: Standard Error Object with code, message, and optional details
- Q: How should the complete_task tool behave when attempting to complete an already completed task? → A: No-op with Success - Return success without changing state
- Q: How should the MCP Server establish and validate the user context for each tool call? → A: JWT Token in Header - Expect JWT tokens in Authorization header to validate user identity
- Q: Should the MCP Server implement rate limiting to prevent abuse or excessive calls to the tools? → A: Per-User Rate Limiting - Limit requests per user_id (e.g., 100 requests per minute per user)
- Q: What are the specific validation requirements for task title and description fields? → A: Reasonable Limits - Title: 1-200 chars, Description: 0-1000 chars, standard text characters

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Agent Interacts with Task Management System (Priority: P1)

An AI assistant needs to manage a user's tasks through standardized tools exposed by the MCP server. The AI agent should be able to create, read, update, complete, and delete tasks on behalf of the user without maintaining any state itself.

**Why this priority**: This is the core functionality that enables AI agents to interact with the task management system, forming the foundation of the entire AI-driven todo application.

**Independent Test**: The AI agent can successfully perform all basic task operations (add, list, update, complete, delete) through the MCP tools, with all state changes persisting in the database and being accessible across different AI agent invocations.

**Acceptance Scenarios**:

1. **Given** an authenticated user context, **When** an AI agent calls add_task, **Then** a new task is created in the database associated with the user
2. **Given** multiple tasks exist for a user, **When** an AI agent calls list_tasks, **Then** the server returns all tasks belonging to that user filtered by requested status
3. **Given** a task exists for a user, **When** an AI agent calls complete_task, **Then** the task's completion status is updated in the database
4. **Given** a task exists for a user, **When** an AI agent calls delete_task, **Then** the task is removed from the database
5. **Given** a task exists for a user, **When** an AI agent calls update_task, **Then** the task's title or description is updated in the database

---

### User Story 2 - Secure Multi-User Task Isolation (Priority: P1)

Different users' tasks must remain isolated and secure, with each user only able to access their own tasks through the AI agent.

**Why this priority**: Security and privacy are fundamental requirements - users must be confident that their tasks remain private and cannot be accessed by other users.

**Independent Test**: When an AI agent operates under User A's context, it cannot access, modify, or delete tasks belonging to User B, and vice versa.

**Acceptance Scenarios**:

1. **Given** User A has tasks and User B has tasks, **When** an AI agent acting as User A calls list_tasks, **Then** only User A's tasks are returned
2. **Given** User A's task exists, **When** an AI agent acting as User B attempts to complete User A's task, **Then** the operation is rejected with an authorization error

---

### User Story 3 - Reliable State Persistence (Priority: P2)

Task data must persist reliably in the database and be available across server restarts and AI agent invocations.

**Why this priority**: Data loss would severely impact user trust and the utility of the task management system.

**Independent Test**: Tasks created through the MCP tools remain accessible after server restarts, and all operations result in persistent changes to the database.

**Acceptance Scenarios**:

1. **Given** a task was created via add_task, **When** the server restarts and AI agent calls list_tasks, **Then** the task is still available
2. **Given** a task was updated via update_task, **When** the server restarts, **Then** the updated task properties are preserved

---

### Edge Cases

- What happens when an AI agent tries to operate on a task that doesn't exist?
- How does the system handle invalid input parameters to MCP tools?
- What occurs when database operations fail during tool execution?
- How does the system respond when an AI agent attempts to access tasks without proper authentication?
- What happens when concurrent AI agents try to modify the same task simultaneously?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose an MCP server that registers the following tools: add_task, list_tasks, complete_task, delete_task, update_task
- **FR-002**: System MUST execute all MCP tools statelessly without storing any in-memory state between requests
- **FR-003**: System MUST persist all task-related state changes to the database upon successful tool execution
- **FR-004**: System MUST enforce user_id scoping to ensure users can only access their own tasks
- **FR-005**: System MUST validate all tool inputs and reject invalid or unauthorized operations
- **FR-006**: System MUST handle task-not-found scenarios gracefully with standard error object responses: {"error": {"code": "...", "message": "...", "details": {...}}}
- **FR-007**: System MUST return structured, machine-readable outputs from all MCP tools
- **FR-008**: System MUST implement the add_task tool that creates a new task for the authenticated user with title, description, and initial completion status
- **FR-020**: System MUST validate task title is 1-200 characters and description is 0-1000 characters with standard text characters when using add_task and update_task
- **FR-009**: System MUST implement the list_tasks tool that retrieves tasks filtered by status (all, pending, completed) for the authenticated user
- **FR-010**: System MUST implement the complete_task tool that marks a specific task as completed for the authenticated user
- **FR-017**: System MUST implement idempotent behavior for complete_task - attempting to complete an already completed task returns success without changing state
- **FR-011**: System MUST implement the delete_task tool that removes a specific task from the authenticated user's task list
- **FR-012**: System MUST implement the update_task tool that modifies task title and/or description for the authenticated user
- **FR-013**: System MUST ensure deterministic behavior across repeated tool calls with identical inputs
- **FR-014**: System MUST validate that all operations are performed by authenticated users with proper authorization via JWT tokens in Authorization header
- **FR-018**: System MUST extract user_id from validated JWT token claims to enforce user_id scoping
- **FR-015**: System MUST return consistent data formats regardless of the MCP client making the request
- **FR-016**: System MUST return standardized error objects in the format {"error": {"code": "...", "message": "...", "details": {...}}} for all failed operations
- **FR-019**: System MUST implement rate limiting per user_id to prevent abuse (e.g., 100 requests per minute per user)

### Key Entities *(include if feature involves data)*

- **Task**: Represents a user's task with attributes: user_id (identifies the owner), id (unique identifier), title (brief description, 1-200 characters), description (detailed explanation, 0-1000 characters), completed (boolean indicating completion status), created_at (timestamp of creation), updated_at (timestamp of last modification)
- **MCP Tool**: Represents an executable function exposed to AI agents with standardized input/output formats and authentication requirements
- **User Context**: Represents the authenticated user identity used to enforce access controls and user isolation
- **Error Object**: Represents standardized error responses in the format {"error": {"code": "...", "message": "...", "details": {...}}} returned for all failed operations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI agents can successfully perform all five core task operations (add, list, complete, delete, update) with 99.9% success rate
- **SC-002**: Task data remains persistent and accessible after server restarts, with zero data loss during normal operation
- **SC-003**: User isolation is maintained with 100% effectiveness - users cannot access other users' tasks under any circumstances
- **SC-004**: All MCP tools respond within 2 seconds under normal load conditions
- **SC-005**: The system handles 1000+ consecutive tool calls without memory leaks or performance degradation
- **SC-006**: Error scenarios are handled gracefully with appropriate error messages 100% of the time
