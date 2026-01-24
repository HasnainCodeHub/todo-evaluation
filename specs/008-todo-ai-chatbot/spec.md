# Feature Specification: Phase 3 - Todo AI Chatbot

**Feature Branch**: `008-todo-ai-chatbot`
**Created**: 2026-01-24
**Status**: Draft
**Input**: User description: "Phase 3 Todo AI Chatbot - Natural language task management with MCP-based stateless architecture and OpenAI Agents SDK"

## Clarifications

### Session 2026-01-24

- Q: How much conversation history should be loaded as context for AI processing? → A: Last 20 messages
- Q: What matching behavior should apply when user references task by partial name? → A: Substring/contains match (case-insensitive)
- Q: What is the maximum allowed length for a single user message? → A: 1,000 characters
- Q: How should system respond when OpenAI API is unavailable? → A: Specific but friendly: "I'm having trouble thinking right now. Please try again in a moment."
- Q: When should a new conversation be created vs. continuing existing? → A: User must explicitly choose "new" or "continue" each time

## Overview

This specification defines the Phase 3 (Basic Level) implementation of a conversational AI interface for managing todos. Users interact with the system through natural language commands, and the AI assistant interprets intent, executes task operations, and provides friendly confirmations. The architecture enforces strict separation between reasoning (chat-orchestrator), execution (mcp-server-agent), and workflow governance (phase-orchestrator).

### Scope

**In Scope:**
- Conversational AI interface for managing todos (add, list, update, complete, delete)
- Stateless chat endpoint with conversation persistence in database
- MCP server exposing task operations as tools
- Clear separation between reasoning, execution, and workflow orchestration
- Natural language understanding for task commands
- Friendly confirmations and error handling

**Out of Scope:**
- Advanced memory (vector DB, embeddings)
- Streaming responses
- Background jobs or schedulers
- UI/UX enhancements beyond basic ChatKit integration
- Voice interface
- Multi-language support (English only for Phase 3)

## User Scenarios & Testing

### User Story 1 - Add Task via Natural Language (Priority: P1)

As a user, I want to add tasks by typing natural language commands so that I can quickly capture my todos without navigating forms or buttons.

**Why this priority**: Task creation is the foundational capability. Without it, no other task management is possible. This delivers immediate value by enabling the core todo capture workflow.

**Independent Test**: Can be fully tested by sending a natural language message like "Add a task to buy groceries" and verifying the task appears in the user's task list with correct title.

**Acceptance Scenarios**:

1. **Given** I am authenticated, **When** I type "Add a task to review the quarterly report", **Then** a task with title "review the quarterly report" is created and I receive confirmation "I've added 'review the quarterly report' to your tasks."

2. **Given** I am authenticated, **When** I type "Create todo: call mom tomorrow", **Then** a task with title "call mom tomorrow" is created and I receive confirmation.

3. **Given** I am authenticated, **When** I type "add task" without a title, **Then** I receive a friendly prompt asking "What would you like to add to your task list?"

---

### User Story 2 - List Tasks via Natural Language (Priority: P1)

As a user, I want to view my tasks by asking in natural language so that I can quickly see what I need to do.

**Why this priority**: Viewing tasks is essential for task management. Users need to see their tasks to make decisions about what to work on.

**Independent Test**: Can be fully tested by having existing tasks and sending "Show my tasks" to verify all user's tasks are displayed.

**Acceptance Scenarios**:

1. **Given** I have 3 tasks (2 pending, 1 completed), **When** I type "Show my tasks", **Then** I see all 3 tasks with their status clearly indicated.

2. **Given** I have tasks, **When** I type "What do I need to do?", **Then** I see my pending tasks listed.

3. **Given** I have no tasks, **When** I type "Show my tasks", **Then** I receive "You don't have any tasks yet. Would you like to add one?"

4. **Given** I have tasks, **When** I type "Show completed tasks", **Then** I see only my completed tasks.

---

### User Story 3 - Complete Task via Natural Language (Priority: P2)

As a user, I want to mark tasks as complete by describing them in natural language so that I can update my progress without knowing task IDs.

**Why this priority**: Completing tasks is the primary workflow outcome. This enables users to track progress and feel accomplishment.

**Independent Test**: Can be tested by creating a task, then saying "I finished [task name]" and verifying the task status changes to completed.

**Acceptance Scenarios**:

1. **Given** I have a task "buy groceries", **When** I type "I finished buying groceries", **Then** the task is marked complete and I receive "Great job! I've marked 'buy groceries' as complete."

2. **Given** I have a task "call mom", **When** I type "Done with calling mom", **Then** the task is marked complete with confirmation.

3. **Given** I have no task matching "clean car", **When** I type "Complete clean car", **Then** I receive "I couldn't find a task matching 'clean car'. Would you like to see your current tasks?"

---

### User Story 4 - Update Task via Natural Language (Priority: P2)

As a user, I want to update task details by describing what to change so that I can refine my todos without recreating them.

**Why this priority**: Task refinement is common as priorities and details evolve. This enables iterative task management.

**Independent Test**: Can be tested by creating a task, then saying "Change [task name] to [new name]" and verifying the update persists.

**Acceptance Scenarios**:

1. **Given** I have a task "buy milk", **When** I type "Change 'buy milk' to 'buy almond milk'", **Then** the task title is updated and I receive confirmation.

2. **Given** I have a task "meeting", **When** I type "Add description to meeting: discuss Q2 budget", **Then** the task description is updated.

3. **Given** no matching task exists, **When** I type "Update nonexistent task", **Then** I receive a friendly error with suggestions.

---

### User Story 5 - Delete Task via Natural Language (Priority: P3)

As a user, I want to delete tasks by describing them so that I can remove tasks that are no longer relevant.

**Why this priority**: Deletion is less frequent than other operations but necessary for task list hygiene.

**Independent Test**: Can be tested by creating a task, then saying "Delete [task name]" and verifying it no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** I have a task "old meeting notes", **When** I type "Delete old meeting notes", **Then** the task is removed and I receive "I've deleted 'old meeting notes' from your tasks."

2. **Given** I have multiple similar tasks, **When** I type "Delete meeting", **Then** the system asks for clarification: "I found multiple tasks with 'meeting'. Which one would you like to delete?" and lists options.

3. **Given** no matching task exists, **When** I type "Delete phantom task", **Then** I receive "I couldn't find a task matching 'phantom task'."

---

### User Story 6 - Conversation Continuity (Priority: P2)

As a user, I want my conversation history to persist so that I can continue where I left off even after closing the app.

**Why this priority**: Conversation continuity provides a seamless experience and enables context-aware responses.

**Independent Test**: Can be tested by starting a conversation, closing the session, reopening, and verifying previous messages are visible and context is maintained.

**Acceptance Scenarios**:

1. **Given** I had a conversation yesterday, **When** I return today and open the same conversation, **Then** I see my previous messages and can continue naturally.

2. **Given** I have an existing conversation, **When** the server restarts, **Then** my conversation history is preserved and accessible.

---

### Edge Cases

- What happens when user sends an ambiguous command like "do it"? → System asks for clarification
- How does system handle very long task titles (>500 characters)? → Truncate with notice to user
- What happens when user tries to complete an already-completed task? → Friendly message: "That task is already complete!"
- How does system handle rapid successive messages? → Process sequentially, maintain order
- What happens when database is temporarily unavailable? → Graceful error: "I'm having trouble right now. Please try again in a moment."
- How does system handle offensive or inappropriate content? → Standard content filtering applies
- What happens when user references task by partial match with multiple results? → Present disambiguation options
- What happens when OpenAI API is unavailable or errors? → Friendly message: "I'm having trouble thinking right now. Please try again in a moment."

## Requirements

### Functional Requirements

#### Chat Interface

- **FR-001**: System MUST accept natural language messages from authenticated users
- **FR-002**: System MUST interpret user intent and map to task operations (add, list, update, complete, delete)
- **FR-003**: System MUST provide friendly, conversational confirmations for all operations
- **FR-004**: System MUST handle ambiguous requests by asking clarifying questions
- **FR-005**: System MUST gracefully handle errors with user-friendly messages (never expose technical details)
- **FR-005a**: System MUST limit user messages to 1,000 characters and reject longer messages with a friendly notice

#### Task Operations

- **FR-006**: System MUST support adding tasks with title extracted from natural language
- **FR-007**: System MUST support listing tasks with filters (all, pending, completed)
- **FR-008**: System MUST support updating task title and description via natural language
- **FR-009**: System MUST support marking tasks as complete via natural language reference
- **FR-010**: System MUST support deleting tasks via natural language reference
- **FR-011**: System MUST match tasks using case-insensitive substring/contains matching when exact match unavailable
- **FR-012**: System MUST present disambiguation options when multiple tasks match a reference

#### Conversation Management

- **FR-013**: System MUST persist all conversation messages to database
- **FR-014**: System MUST load conversation history when user returns to existing conversation
- **FR-015**: System MUST maintain message ordering and timestamps
- **FR-016**: System MUST support multiple conversations per user
- **FR-016a**: System MUST load the last 20 messages as context when processing a new user message
- **FR-016b**: System MUST prompt user to choose "new conversation" or "continue existing" when entering the chat interface

#### Architecture Constraints

- **FR-017**: Chat endpoint MUST be stateless (no in-memory state between requests)
- **FR-018**: All task mutations MUST occur exclusively through MCP tools
- **FR-019**: AI reasoning agent (chat-orchestrator) MUST NOT access database directly
- **FR-020**: MCP tools MUST be stateless and deterministic
- **FR-021**: All database queries MUST be scoped by user_id (no cross-user data access)

#### Agent Responsibilities

- **FR-022**: chat-orchestrator MUST interpret user intent and decide which MCP tool(s) to call
- **FR-023**: chat-orchestrator MUST chain multiple tools when required (e.g., list → identify → delete)
- **FR-024**: mcp-server-agent MUST execute MCP tool calls and persist results to database
- **FR-025**: mcp-server-agent MUST enforce user_id scoping on all operations
- **FR-026**: mcp-server-agent MUST return structured responses for chat-orchestrator to format

### Key Entities

- **Task**: Represents a todo item
  - Attributes: user_id, id, title, description, completed status, created timestamp, updated timestamp
  - Relationships: Belongs to a user (via user_id)

- **Conversation**: Represents a chat session
  - Attributes: user_id, id, created timestamp, updated timestamp
  - Relationships: Belongs to a user, contains many messages

- **Message**: Represents a single message in a conversation
  - Attributes: user_id, id, conversation_id, role (user/assistant), content, created timestamp
  - Relationships: Belongs to a conversation, belongs to a user

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can manage all task operations (add, list, update, complete, delete) using only natural language commands
- **SC-002**: 90% of clear user intents are correctly interpreted and executed on first attempt
- **SC-003**: Conversation history persists correctly across server restarts with 100% data integrity
- **SC-004**: System responds to user messages within 5 seconds under normal load
- **SC-005**: All task mutations occur exclusively through MCP tools (verified by architecture audit)
- **SC-006**: Zero instances of cross-user data access (enforced by user_id scoping)
- **SC-007**: Users receive friendly, non-technical error messages for all failure scenarios
- **SC-008**: System handles 100 concurrent users without degradation

## Assumptions

1. **Authentication**: Users are already authenticated via the existing Better Auth + JWT flow from Phase 2
2. **Database**: Neon PostgreSQL is available and configured from previous phases
3. **User Interface**: Basic ChatKit integration provides the chat UI; no custom UI development required
4. **Language**: English-only natural language processing for Phase 3
5. **Model**: OpenAI GPT model is available via API for natural language understanding
6. **Content Policy**: Standard content filtering is handled by the underlying AI model
7. **Rate Limits**: Standard API rate limits apply; no custom throttling required for Phase 3

## Dependencies

1. **Phase 2 Authentication**: JWT authentication flow must be operational
2. **Phase 2 Task API**: Existing task CRUD endpoints provide the foundation
3. **Database Infrastructure**: Neon PostgreSQL with existing task table
4. **OpenAI API Access**: Valid API key for GPT model access
5. **MCP SDK**: Model Context Protocol SDK for tool definitions

## Constraints

1. **No Streaming**: Responses are returned complete, not streamed
2. **No Background Processing**: All operations are synchronous within request lifecycle
3. **No Advanced Memory**: No vector database or embedding-based context retrieval
4. **Stateless Architecture**: Server maintains no in-memory state between requests
5. **Single Language**: English only for natural language understanding
