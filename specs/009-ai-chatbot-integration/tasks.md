# Tasks: AI Chatbot Integration

**Input**: Design documents from `/specs/009-ai-chatbot-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.yaml, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**Implementation Skill**: Use `@.claude/skills/openai-agent-sdk-integration` for agent implementation patterns.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize new modules and dependencies for AI chatbot feature

- [x] T001 Add OpenAI Agents SDK dependencies to backend/requirements.txt (openai-agents, httpx)
- [x] T002 [P] Create agents module directory structure: backend/app/agents/__init__.py
- [x] T003 [P] Add environment variables to backend/.env.example (OPENAI_API_KEY, MCP_SERVER_URL, CHAT_MODEL)
- [x] T004 [P] Update backend/app/config.py with chat-related settings (openai_api_key, mcp_server_url, chat_model, chat_context_limit)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database models, schemas, and CRUD operations that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Data Models (from data-model.md)

- [x] T005 [P] Create Conversation SQLModel entity in backend/app/models/conversation.py
- [x] T006 [P] Create Message SQLModel entity in backend/app/models/conversation.py
- [x] T007 Update backend/app/models/__init__.py to export Conversation and Message

### Pydantic Schemas (from contracts/chat-api.yaml)

- [x] T008 [P] Create ChatRequest schema in backend/app/schemas/chat.py
- [x] T009 [P] Create ChatResponse schema in backend/app/schemas/chat.py
- [x] T010 [P] Create ConversationResponse and MessageResponse schemas in backend/app/schemas/chat.py
- [x] T011 Update backend/app/schemas/__init__.py to export chat schemas

### Conversation CRUD Operations

- [x] T012 Create conversation CRUD functions in backend/app/crud/conversation.py:
  - create_conversation(user_id: str) -> Conversation
  - get_conversation(conversation_id: str, user_id: str) -> Conversation | None
  - get_or_create_conversation(user_id: str, conversation_id: str | None) -> Conversation
  - update_conversation_timestamp(conversation_id: str) -> None

### Message CRUD Operations

- [x] T013 Create message CRUD functions in backend/app/crud/conversation.py:
  - add_message(conversation_id: str, role: str, content: str) -> Message
  - get_messages(conversation_id: str, limit: int = 20) -> list[Message]

### Database Migration

- [x] T014 Run SQL migration to create conversation and message tables (see data-model.md)

**Checkpoint**: Foundation ready - agent and chat endpoint work can now begin

---

## Phase 3: User Story 1 - Create Task via Natural Language (Priority: P1) 🎯 MVP

**Goal**: User can send natural language messages to create tasks, agent invokes add_task MCP tool

**Independent Test**: Send "Add a task to buy groceries" and verify task appears in system via list_tasks

### Chat Orchestrator Agent (Core)

- [x] T015 [US1] Create chat-orchestrator agent in backend/app/agents/chat_orchestrator.py using @.claude/skills/openai-agent-sdk-integration:
  - Initialize Agent with name="chat-orchestrator"
  - Configure system prompt (task management specialist)
  - Connect to MCP server via MCPServerStreamableHttp transport
  - Implement run_agent(user_message: str, history: list, authorization: str) -> str

- [x] T016 [US1] Implement MCP connection helper in backend/app/agents/chat_orchestrator.py:
  - Use MCPServerStreamableHttpParams with MCP_SERVER_URL from config
  - Enable cache_tools_list=True for performance
  - Pass authorization header for JWT propagation

### Chat Service Layer

- [x] T017 [US1] Create chat service in backend/app/services/chat_service.py:
  - process_chat(user_id: str, message: str, conversation_id: str | None, authorization: str) -> ChatResponse
  - Load/create conversation
  - Build history from stored messages
  - Run agent with history
  - Save user message and assistant response
  - Return ChatResponse

### Chat Router

- [x] T018 [US1] Create POST /api/chat endpoint in backend/app/routers/chat.py:
  - Accept ChatRequest body
  - Require JWT authentication (Depends(get_current_user))
  - Call chat_service.process_chat()
  - Return ChatResponse

- [x] T019 [US1] Register chat router in backend/app/main.py

### System Prompt for Task Creation

- [x] T020 [US1] Define SYSTEM_PROMPT constant in backend/app/agents/chat_orchestrator.py with:
  - Role: task management assistant
  - Capability: create tasks via add_task tool
  - Guidelines: be friendly, confirm actions, handle ambiguity
  - Examples: "Add a task to buy groceries"

**Checkpoint**: User Story 1 complete - users can create tasks via natural language

---

## Phase 4: User Story 2 - List Tasks via Natural Language (Priority: P1)

**Goal**: User can ask "What are my tasks?" and receive formatted list via list_tasks MCP tool

**Independent Test**: Ask "Show my tasks" and verify response includes all user's tasks

### Agent Enhancement for Listing

- [x] T021 [US2] Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add capability: list tasks via list_tasks tool
  - Add examples: "What's on my list?", "Show me my tasks"
  - Add formatting guidelines for task lists

- [x] T022 [US2] Test list_tasks intent recognition with chat endpoint

**Checkpoint**: User Stories 1 & 2 complete - users can create and list tasks

---

## Phase 5: User Story 3 - Complete Task via Natural Language (Priority: P2)

**Goal**: User can mark tasks complete via natural language using complete_task MCP tool

**Independent Test**: Say "Mark buy groceries as done" and verify task status changes

### Agent Enhancement for Completion

- [x] T023 [US3] Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add capability: complete tasks via complete_task tool
  - Add examples: "Mark groceries as done", "I finished task 3"
  - Add guidelines for matching tasks by title or ID

- [x] T024 [US3] Test complete_task intent recognition with chat endpoint

**Checkpoint**: User Story 3 complete - users can complete tasks via natural language

---

## Phase 6: User Story 4 - Update Task via Natural Language (Priority: P2)

**Goal**: User can update task details via natural language using update_task MCP tool

**Independent Test**: Say "Change buy milk to buy almond milk" and verify task title updates

### Agent Enhancement for Updates

- [x] T025 [US4] Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add capability: update tasks via update_task tool
  - Add examples: "Change the title of task 2", "Update grocery task"
  - Add guidelines for partial updates

- [x] T026 [US4] Test update_task intent recognition with chat endpoint

**Checkpoint**: User Story 4 complete - users can update tasks via natural language

---

## Phase 7: User Story 5 - Delete Task via Natural Language (Priority: P3)

**Goal**: User can delete tasks via natural language using delete_task MCP tool

**Independent Test**: Say "Delete the old task" and verify task is removed

### Agent Enhancement for Deletion

- [x] T027 [US5] Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add capability: delete tasks via delete_task tool
  - Add examples: "Delete task 5", "Remove the old task"
  - Add confirmation guidelines for destructive actions

- [x] T028 [US5] Test delete_task intent recognition with chat endpoint

**Checkpoint**: User Story 5 complete - users can delete tasks via natural language

---

## Phase 8: User Story 6 - Multi-Step Task Operations (Priority: P3)

**Goal**: User can issue compound commands that chain multiple MCP tool calls

**Independent Test**: Say "Create a meeting task and then show me all my tasks" and verify both operations complete

### Agent Enhancement for Chaining

- [x] T029 [US6] Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add capability: chain multiple tool calls
  - Add examples: "Add task and show list", "Complete task 3 and delete it"
  - Add guidelines for multi-step confirmation

- [x] T030 [US6] Test tool chaining with compound commands

**Checkpoint**: User Story 6 complete - users can issue multi-step commands

---

## Phase 9: User Story 7 - Conversation Context Awareness (Priority: P2)

**Goal**: Agent understands references to previous context like "Add another one"

**Independent Test**: Create a task, then say "Add another one" and verify new task is created

### Context-Aware Agent

- [x] T031 [US7] Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add capability: understand follow-up references
  - Add examples: "Add another one", "Actually, delete that"
  - Add guidelines for context resolution

- [x] T032 [US7] Verify conversation history is passed correctly to agent in backend/app/services/chat_service.py

- [x] T033 [US7] Test context awareness with follow-up messages

**Checkpoint**: User Story 7 complete - agent understands conversation context

---

## Phase 10: Error Handling & Edge Cases

**Purpose**: Robust error handling for MCP failures, invalid input, and edge cases

### MCP Error Handling

- [x] T034 Implement MCP unavailability handling in backend/app/agents/chat_orchestrator.py:
  - Catch connection errors
  - Return friendly message: "I'm having trouble completing that action right now. Please try again."

- [x] T035 Implement MCP tool error handling in backend/app/services/chat_service.py:
  - Catch tool invocation errors
  - Convert to user-friendly error messages
  - Log technical details for debugging

### Input Validation

- [x] T036 [P] Add message validation in backend/app/schemas/chat.py:
  - Validate message length (1-10,000 characters)
  - Handle empty/whitespace-only messages

- [x] T037 [P] Add conversation_id validation in backend/app/routers/chat.py:
  - Validate UUID format
  - Handle invalid conversation references

### Off-Topic Handling

- [x] T038 Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add redirect guidelines for non-task messages
  - Include helpful examples in redirect response

### Ambiguity Handling

- [x] T039 Extend SYSTEM_PROMPT in backend/app/agents/chat_orchestrator.py:
  - Add guidelines for handling ambiguous task references
  - List matching tasks when multiple match
  - Ask for clarification when needed

**Checkpoint**: Error handling complete - system handles failures gracefully

---

## Phase 11: Statelessness & Conversation Persistence

**Purpose**: Ensure stateless behavior and proper conversation retention

### Statelessness Verification

- [x] T040 Verify no in-memory state in backend/app/agents/chat_orchestrator.py:
  - Agent is created fresh each request
  - No module-level state storage
  - All context from database

- [x] T041 Verify stateless behavior in backend/app/services/chat_service.py:
  - History loaded from DB each request
  - Messages saved after each request
  - No session caching

### Conversation Retention

- [x] T042 Implement conversation cleanup in backend/app/crud/conversation.py:
  - delete_old_conversations(days: int = 30) -> int
  - Delete conversations older than 30 days from updated_at

- [x] T043 [P] Add conversation list endpoint GET /api/conversations in backend/app/routers/chat.py

- [x] T044 [P] Add conversation detail endpoint GET /api/conversations/{id} in backend/app/routers/chat.py

- [x] T045 [P] Add conversation delete endpoint DELETE /api/conversations/{id} in backend/app/routers/chat.py

**Checkpoint**: Persistence complete - conversations properly stored and retained

---

## Phase 12: Polish & Verification

**Purpose**: Final validation, documentation, and cleanup

### Verification Tasks

- [x] T046 Verify agent calls MCP tools for all task mutations (no direct DB access)
- [x] T047 Verify stateless behavior across repeated requests
- [x] T048 Verify JWT authorization is passed through to MCP tools
- [x] T049 Verify conversation context spans at least 20 messages (SC-004)
- [x] T050 Verify response time <5 seconds for single operations (SC-003)

### Documentation & Cleanup

- [x] T051 [P] Update backend/CLAUDE.md with chat endpoint documentation
- [x] T052 [P] Run quickstart.md validation steps
- [x] T053 Code review and cleanup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational
  - User Story 2 (P1): Can start in parallel with US1
  - User Stories 3-7: Can proceed in priority order after P1 stories
- **Error Handling (Phase 10)**: Can proceed after Phase 3 (US1) is complete
- **Statelessness (Phase 11)**: Can proceed after Phase 3 (US1) is complete
- **Polish (Phase 12)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Run In Parallel With |
|-------|------------|--------------------------|
| US1 (Create) | Foundational | US2 |
| US2 (List) | Foundational | US1 |
| US3 (Complete) | Foundational | US4, US5 |
| US4 (Update) | Foundational | US3, US5 |
| US5 (Delete) | Foundational | US3, US4 |
| US6 (Multi-step) | US1-US5 | US7 |
| US7 (Context) | Foundational | US6 |

### Within Each User Story

1. Models before services
2. Services before endpoints
3. Agent enhancement before testing
4. Story complete before moving to next

---

## Parallel Execution Examples

### Phase 1 (Setup) - All Parallel

```bash
T002: Create agents module directory
T003: Add environment variables
T004: Update config.py
```

### Phase 2 (Foundational) - Models Parallel

```bash
T005: Create Conversation model
T006: Create Message model
T008: Create ChatRequest schema
T009: Create ChatResponse schema
T010: Create ConversationResponse schema
```

### User Stories 1 & 2 - Parallel Start

```bash
# Developer A: User Story 1
T015-T020: Agent core, service, router

# Developer B: User Story 2
T021-T022: List tasks enhancement (after T015)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Create Task)
4. Complete Phase 4: User Story 2 (List Tasks)
5. **STOP and VALIDATE**: Test create and list via chat
6. Deploy/demo if ready

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 + US2 → Can create and list tasks
2. **+Complete**: Add US3 → Can complete tasks
3. **+Update**: Add US4 → Can update tasks
4. **+Delete**: Add US5 → Can delete tasks
5. **+Multi-step**: Add US6 → Can chain operations
6. **+Context**: Add US7 → Full context awareness
7. **+Polish**: Error handling, verification

---

## Notes

- **[P]** tasks = different files, no dependencies
- **[Story]** label maps task to specific user story
- **Skill**: Use `@.claude/skills/openai-agent-sdk-integration` for agent patterns
- Each user story is independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate
