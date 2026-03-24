# Feature Specification: Chatbot UI

**Feature Branch**: `010-chatbot-ui`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "phase-3-chatbot-ui: Chatbot UI layer integrated with Next.js frontend allowing users to interact with an AI chatbot that manages tasks through natural language"

## Overview

This specification defines the conversational user interface layer that allows authenticated users to manage their task list entirely through natural language. Users type messages into a chat panel and receive AI-generated responses confirming actions taken (tasks created, completed, deleted, etc.). The chat interface serves as the primary interaction point between users and the AI-powered task management system.

## Clarifications

### Session 2026-02-18

- Q: How is conversation history loaded on page refresh? → A: Call `GET /api/conversations/{id}` to fetch history from the existing backend endpoint on load.
- Q: What happens when the user's authentication session expires mid-conversation? → A: Display an inline error message ("Your session has expired — please log in again") then redirect to the login page.
- Q: Where is the conversation ID stored on the client? → A: `localStorage` — persists across tabs and browser restarts so conversation resumes after closing and reopening the browser.
- Q: Where is the chat panel placed within the dashboard layout? → A: Side panel — chat and task list are visible side-by-side on the same dashboard page so users can see tasks update as they issue commands.
- Q: How should unusually long assistant responses be displayed? → A: Auto-expand — the message bubble grows vertically to show the full content; the conversation panel scrolls to the bottom automatically.

### Session 2026-03-25

- Q: What should happen when a user asks the chatbot to delete a task? -> A: Show a confirmation popup before sending the delete request. If the user confirms, proceed with the delete message. If the user cancels, do not send and remain on the dashboard.
- Q: How can users reliably target the correct task in chatbot commands? -> A: Display each task ID clearly in the task list UI so users can reference IDs in chat commands (for example, "delete task 12").
- Q: What feedback should users see when they mark a task as completed from the dashboard? -> A: Show a task-specific loading message while completion is in progress, then show a short success message with a completion icon after the action succeeds.
- Q: Should this feedback pattern apply only to completion? -> A: No. Apply professional progress and success feedback across task actions, including create, update, complete, reopen, and delete.
- Q: What additional professional details should be shown in task cards without changing backend schema? -> A: Add a metadata row using existing task fields, including created time, updated time, and a clear last-modified indicator.
- Q: What professional metadata should be captured during task creation? -> A: Add priority, due date, and category so tasks are better structured for real work.

## Scope

### In Scope
- Chat panel UI embedded as a side panel within the authenticated dashboard, displayed alongside the task list view
- Sending user messages to the backend chat endpoint
- Displaying conversation history (user and assistant messages)
- Loading and error states for chat interactions
- Secure configuration for production domain access
- Conversation persistence across page refreshes (via conversation ID)

### Out of Scope
- AI agent logic and MCP tool execution (handled by backend)
- Direct database or MCP server calls from the frontend
- Real-time streaming of responses
- Voice input or output
- File attachments in chat
- Multi-conversation switching within the same session

## Architecture Constraints

1. **No Direct Tool Calls**: The UI MUST NOT call MCP tools or the AI agent directly
2. **Single Endpoint**: All messages route exclusively through the backend chat endpoint
3. **Stateless Interaction**: Each message sends full conversation ID; no client-side session state beyond conversation ID
4. **Authenticated Access Only**: Chat panel is only accessible to authenticated users
5. **Domain Security**: Production deployment requires proper domain allowlist configuration for the chat provider

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Message and Receive Response (Priority: P1)

An authenticated user types a natural language message in the chat panel and receives a confirmation response from the AI assistant indicating what action was performed on their task list.

**Why this priority**: This is the core value proposition — without the ability to send messages and receive responses, the chatbot UI has no function. All other user stories depend on this flow working.

**Independent Test**: Can be fully tested by typing "Add a task to buy groceries" in the chat panel and verifying an AI response appears confirming the task was created, and the task subsequently appears in the task list view.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the dashboard, **When** they type "Create a task called Review PR #42" and submit, **Then** the message appears in the chat panel as a user bubble, a loading indicator appears, and an assistant response confirms the task was created.

2. **Given** a user has sent a message and is waiting, **When** the backend returns a response, **Then** the loading indicator disappears and the assistant response renders in a distinct visual style from the user message.

3. **Given** a user types a message and presses Enter or clicks Send, **Then** the input field clears and the message appears in the conversation view immediately before the response arrives.

---

### User Story 2 - View Conversation History (Priority: P1)

A user can scroll through the full conversation within the current session, seeing a chronological list of their messages and AI responses.

**Why this priority**: Without visible conversation history, users cannot track what actions they have requested or understand the context of previous assistant responses.

**Independent Test**: Can be tested by sending three messages in sequence and verifying all six messages (three user, three assistant) appear in the correct order in the conversation panel.

**Acceptance Scenarios**:

1. **Given** a user has exchanged multiple messages, **When** they view the chat panel, **Then** all messages appear in chronological order with clear visual distinction between user and assistant messages.

2. **Given** a long conversation, **When** a new message arrives, **Then** the conversation panel scrolls automatically to show the latest message.

3. **Given** a user refreshes the page, **When** the chat panel reloads, **Then** the previous conversation history is restored using the stored conversation ID.

---

### User Story 3 - Handle Loading and Error States (Priority: P2)

The chat panel communicates clearly when a response is pending or when the backend is unavailable, preventing user confusion about whether their message was processed.

**Why this priority**: Users need feedback to know the system is working. Without loading and error states, users may submit duplicate messages or abandon the feature.

**Independent Test**: Can be tested by sending a message and observing the loading indicator, then simulating a network failure and verifying a user-friendly error message appears.

**Acceptance Scenarios**:

1. **Given** a user submits a message, **When** the backend has not yet responded, **Then** a visible loading indicator is shown and the send button is disabled to prevent duplicate submissions.

2. **Given** the backend returns an error, **When** the error is received by the UI, **Then** a friendly error message is displayed in the conversation view without exposing technical details.

3. **Given** a network timeout occurs, **When** the request fails, **Then** the user is informed they can try again and the send button is re-enabled.

---

### User Story 4 - Complete Task Management via Chat (Priority: P2)

A user can perform all core task operations — create, list, complete, update, delete — exclusively through the chat interface without touching any other UI control.

**Why this priority**: The chatbot UI is the primary interface for AI-driven task management. If users must switch to traditional controls for some operations, the chat interface fails its core purpose.

**Independent Test**: Can be tested by performing a full workflow: create a task, list tasks, mark one complete, update another's title, then delete one — all through chat messages — and verifying each operation is reflected immediately in the task list panel displayed alongside the chat panel.

**Acceptance Scenarios**:

1. **Given** a user with no tasks, **When** they send "Add a task to call mom", "What are my tasks?", "Mark it as done", and "Delete it" in sequence, **Then** each response confirms the corresponding action and the final task list is empty.

2. **Given** a user sends "Show me my tasks", **When** the assistant responds, **Then** the response lists all current tasks with their status, formatted in a readable way within the chat bubble.

---

### User Story 5 - Confirm Task Deletion in Chat (Priority: P1)

A user must explicitly confirm task deletion requests initiated from the chat panel before the request is sent to the backend.

**Why this priority**: Deletion is destructive and irreversible from the user's perspective. Confirmation prevents accidental deletes caused by mistyped or ambiguous natural language prompts.

**Independent Test**: Enter a delete command in chat and verify a confirmation popup appears. Click "No" and verify no request is sent. Repeat and click "Yes" and verify the delete request is sent and reflected in task list updates.

**Acceptance Scenarios**:

1. **Given** a user types a delete-oriented message (for example, "delete task 3"), **When** they submit it, **Then** a confirmation popup appears before any backend request is made.

2. **Given** the popup is visible, **When** the user clicks "Yes", **Then** the original delete message is sent to the chat endpoint and normal loading/response flow continues.

3. **Given** the popup is visible, **When** the user clicks "No", **Then** the popup closes, no delete request is sent, and the user remains on the current dashboard page.

---

### User Story 6 - Show Task IDs for Chat Commands (Priority: P1)

Users can see task IDs directly in the dashboard task list so they can issue precise chatbot commands (complete/update/delete by ID).

**Why this priority**: Chatbot operations that target a specific task are more reliable when users can reference a visible task ID.

**Independent Test**: Create multiple tasks and verify each card shows a visible ID. Send chatbot commands using those IDs and verify the intended task is affected.

**Acceptance Scenarios**:

1. **Given** tasks are displayed in the dashboard list, **When** the user views any task card, **Then** the task ID is visible alongside task details.

2. **Given** a user wants to delete or update a specific task via chat, **When** they reference the visible ID in the message, **Then** the command targets the intended task.

---
### User Story 7 - Completion Feedback In Task Cards (Priority: P2)

Users receive explicit visual feedback when they mark a task as completed from the dashboard task list.

**Why this priority**: Completion is an important state change. Clear progress and success feedback reduces uncertainty and makes the interaction feel deliberate.

**Independent Test**: Mark an incomplete task as completed and verify a task-specific loading message appears, followed by a short success message with a completion icon.

**Acceptance Scenarios**:

1. **Given** an incomplete task card, **When** the user marks it as completed, **Then** the card shows a loading message that includes the task title while the request is in progress.

2. **Given** the completion request succeeds, **When** the task state updates, **Then** the card shows a short success message with a completion icon before settling into the completed state.

---
### User Story 8 - Professional Feedback Across Task Actions (Priority: P2)

Users receive consistent, professional progress and success feedback for all major task actions performed in the dashboard.

**Why this priority**: Consistent system feedback improves trust and reduces uncertainty during asynchronous operations.

**Independent Test**: Create, update, complete, reopen, and delete tasks and verify each action shows professional progress or success messaging appropriate to that action.

**Acceptance Scenarios**:

1. **Given** a user edits a task, **When** the update is submitted, **Then** the UI presents progress feedback and a professional success confirmation when the update finishes.

2. **Given** a user reopens a completed task, **When** the request succeeds, **Then** the UI confirms that the task has been marked active again.

3. **Given** a user deletes a task, **When** the request succeeds, **Then** the UI shows a professional deletion confirmation even though the task card is removed.

4. **Given** a user creates a task, **When** the request succeeds, **Then** the UI shows a professional creation confirmation.

---
### User Story 9 - Professional Task Metadata Row (Priority: P2)

Users can see professional task metadata directly in each task card without opening an edit view.

**Why this priority**: Visible metadata improves trust, traceability, and task context while keeping the card useful for day-to-day work.

**Independent Test**: Open the dashboard and verify each task card shows created time, updated time, and a last-modified indicator derived from current task data.

**Acceptance Scenarios**:

1. **Given** a task card is visible, **When** the user scans the card, **Then** created and updated timestamps are displayed in a compact professional layout.

2. **Given** a task has been modified after creation, **When** the user views the card, **Then** the card shows a clear last-modified indicator derived from `updated_at`.

---
### User Story 10 - Structured Task Creation Metadata (Priority: P1)

Users can create tasks with structured metadata fields that make the task list more useful and professionally organized.

**Why this priority**: Title and description alone are too limited for day-to-day planning. Priority, due date, and category materially improve clarity and execution.

**Independent Test**: Create a task with priority, due date, and category, then verify those values are returned by the API and displayed on the dashboard task card.

**Acceptance Scenarios**:

1. **Given** the user opens the task creation form, **When** they expand the form, **Then** they can set task priority, optional due date, and optional category in addition to title and description.

2. **Given** the user submits the creation form with those fields populated, **When** the backend saves the task, **Then** the created task response includes the same metadata.

3. **Given** a task includes priority, due date, or category, **When** the user views the task card, **Then** those values are shown in a compact professional layout.

---
### Edge Cases

- What happens when the user submits an empty or whitespace-only message?
- What happens when the user rapidly submits multiple messages before the first response arrives?
- What happens when the user's authentication session expires mid-conversation? → Display an inline error message ("Your session has expired — please log in again") and redirect the user to the login page.
- What happens when the response from the backend is unusually long? → The message bubble auto-expands vertically to display the full response; no truncation or "show more" controls; the panel auto-scrolls to the bottom.
- What happens when the `GET /api/conversations/{id}` call fails on page refresh (e.g., conversation deleted or network error)? → System starts a new conversation silently rather than blocking the user.
- What happens if the user navigates away and back during a pending request?
- What happens when a delete intent is submitted accidentally? -> A confirmation popup must appear before the delete message is sent.
- What happens when due date or category is left blank? -> The task is still created successfully and those values remain empty.
- What happens when a task has no due date or category? -> The task card omits those optional values instead of showing placeholder content.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a chat input field and send control accessible only to authenticated users
- **FR-002**: System MUST send the user's message and current conversation identifier to the backend chat endpoint upon submission
- **FR-003**: System MUST render user messages and assistant responses in distinct visual styles in chronological order
- **FR-004**: System MUST display a loading indicator from the moment a message is submitted until a response is received
- **FR-005**: System MUST disable the message input and send control while a response is pending to prevent duplicate submissions
- **FR-006**: System MUST display backend error messages in user-friendly language without exposing technical error details
- **FR-007**: System MUST persist the conversation identifier in `localStorage` and, on page load, call the conversation detail endpoint (`GET /api/conversations/{id}`) to restore the full message history before the user sends a new message; the conversation resumes correctly even after the browser is fully closed and reopened
- **FR-008**: System MUST automatically scroll the conversation view to the latest message after each exchange; message bubbles auto-expand vertically to display the full response without truncation
- **FR-009**: System MUST clear the input field immediately after the user submits a message
- **FR-010**: System MUST reject empty or whitespace-only message submissions without sending a request
- **FR-011**: System MUST pass the authenticated user's session credentials with every chat request
- **FR-012**: System MUST function in both local development and production environments with appropriate security configuration
- **FR-013**: System MUST NOT make direct calls to MCP tools, AI agents, or databases from the frontend
- **FR-014**: When the backend returns a 401 Unauthorized response (session expired), the system MUST display an inline message ("Your session has expired — please log in again") and redirect the user to the login page
- **FR-015**: System MUST show a confirmation popup for delete-intent chat submissions; "Yes" sends the original message, and "No" cancels without sending any request
- **FR-016**: System MUST display task IDs in the dashboard task list so users can reference those IDs in chatbot commands
- **FR-017**: System MUST show task-specific loading and success feedback when a user marks a task as completed from the dashboard task list
- **FR-018**: System MUST provide consistent professional progress and success feedback across create, update, complete, reopen, and delete task actions in the dashboard UI
- **FR-019**: System MUST display a professional metadata row in task cards using existing task fields, including created time, updated time, and last-modified information
- **FR-020**: System MUST allow task creation and update requests to include `priority`, `due_date`, and `category`
- **FR-021**: System MUST persist `priority`, `due_date`, and `category` in backend task storage and return those fields in task API responses
- **FR-022**: System MUST display task priority, due date, and category in a professional layout when those values are present

### Key Entities

- **Chat Message**: A single exchange unit in the conversation
  - Has a role (user or assistant)
  - Has content (text)
  - Has a timestamp for display ordering

- **Conversation Session**: The ongoing dialogue between user and assistant
  - Has a unique identifier used for history continuity
  - Belongs to a single authenticated user
  - Contains an ordered list of messages
  - Identifier is stored in `localStorage` on the client so the session persists across browser restarts

- **Chat Request**: What the UI sends to the backend
  - Contains the user's message text
  - Contains the conversation identifier (optional for new conversations)
  - Carries the user's authentication credentials

- **Chat Response**: What the UI receives from the backend
  - Contains the assistant's response text
  - Contains the conversation identifier for follow-up requests

- **Task Metadata**: Structured planning fields stored with a task
  - Includes `priority` with values `low`, `medium`, or `high`
  - Includes optional `due_date`
  - Includes optional `category`

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, list, complete, update, and delete tasks exclusively through natural language chat messages without using any other UI control
- **SC-002**: The chat panel displays the assistant's response within 10 seconds for 90% of requests under normal conditions
- **SC-003**: Loading and error states are visible to the user 100% of the time when applicable — no silent failures
- **SC-004**: Conversation history is restored correctly after page refresh in 100% of cases where a prior conversation exists
- **SC-005**: The chat interface functions correctly in both development (localhost) and production environments with zero configuration errors preventing usage
- **SC-006**: Users cannot submit an empty message — empty submissions are blocked at the UI layer in 100% of cases
- **SC-007**: No technical error details (stack traces, error codes, internal system names) are ever visible to the user in the chat panel

---

## Assumptions

- The backend chat endpoint (`POST /api/chat`) is operational and returns structured responses
- The user is authenticated via an existing session before accessing the chat panel
- The backend handles all AI processing and MCP tool invocation — the frontend only sends and receives text
- Conversation history is stored server-side; the frontend only needs to store the conversation ID locally
- No streaming or partial responses are required — responses arrive as complete messages
- The chat panel is displayed as a side panel on the dashboard, alongside the task list, on the same page and URL — no dedicated route required
- Development environment runs on localhost without domain security requirements

## Dependencies

- Existing backend chat endpoint with JWT authentication
- Existing user authentication system (session-based)
- Existing dashboard layout for embedding the chat panel
- Production domain configuration for chat provider security




