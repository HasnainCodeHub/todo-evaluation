# Implementation Plan: AI Chatbot Integration

**Branch**: `009-ai-chatbot-integration` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-ai-chatbot-integration/spec.md`

## Summary

Implement an AI chatbot layer using OpenAI Agents SDK that integrates with the existing MCP Server to enable natural-language-based task management. The chat-orchestrator agent interprets user messages, invokes MCP tools for all task operations, and maintains conversation context via database-backed persistence. The agent remains stateless per request with all task state managed through the existing MCP tools.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: OpenAI Agents SDK (`openai-agents`), FastAPI, SQLModel, PyJWT
**Storage**: Neon PostgreSQL (existing) + new Conversation/Message tables
**Testing**: pytest with async support
**Target Platform**: Linux server (Vercel serverless)
**Project Type**: web (existing backend extension)
**Performance Goals**: <5s response time, 100 concurrent requests
**Constraints**: Stateless per request, no direct DB access from agent for tasks, MCP-only task mutations

## Implementation Resources

### Required Skill

**Use the `openai-agent-sdk-integration` skill** for implementing the chat-orchestrator agent:

```
.claude/skills/openai-agent-sdk-integration/
├── SKILL.md                           # Main skill with patterns
└── references/
    ├── agent-patterns.md              # Agent creation, Runner usage
    ├── mcp-server-patterns.md         # MCP server integration
    ├── tool-filtering.md              # Static/dynamic tool filtering
    ├── multi-agent-orchestration.md   # Handoffs (not used here)
    ├── transport-options.md           # HTTP, stdio, SSE transports
    └── guardrails-tracing.md          # Input/output validation
```

**Key patterns from skill:**
- Agent creation with `Agent()` class and `Runner.run()`
- MCP HTTP transport with `MCPServerStreamableHttp`
- Tool caching with `cache_tools_list=True`
- Error handling for MCP unavailability

**Implementation directive:** When implementing `backend/app/agents/chat_orchestrator.py`, follow the patterns documented in `@.claude/skills/openai-agent-sdk-integration`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Constitution Defined | ⚠️ Template | Constitution contains placeholders only |
| Test-First | ✅ Applicable | TDD approach will be followed |
| Simplicity | ✅ Pass | Single agent, no over-engineering |

*Note: Project constitution is in template state. Proceeding with standard best practices.*

## Project Structure

### Documentation (this feature)

```text
specs/009-ai-chatbot-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── chat-api.yaml    # OpenAPI spec for chat endpoint
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── task.py              # Existing
│   │   └── conversation.py      # NEW: Conversation & Message models
│   ├── schemas/
│   │   ├── task.py              # Existing
│   │   └── chat.py              # NEW: ChatRequest, ChatResponse schemas
│   ├── crud/
│   │   ├── task.py              # Existing
│   │   └── conversation.py      # NEW: Conversation CRUD
│   ├── routers/
│   │   ├── tasks.py             # Existing
│   │   └── chat.py              # NEW: Chat endpoint router
│   ├── services/
│   │   ├── task_service.py      # Existing
│   │   └── chat_service.py      # NEW: Chat orchestration service
│   ├── agents/
│   │   ├── __init__.py          # NEW
│   │   └── chat_orchestrator.py # NEW: OpenAI Agents SDK agent
│   ├── tools/
│   │   └── task_tools.py        # Existing MCP tools
│   ├── mcp_server.py            # Existing
│   └── main.py                  # Updated: Add chat router
└── tests/
    ├── unit/
    │   └── test_chat_service.py # NEW
    ├── integration/
    │   └── test_chat_flow.py    # NEW
    └── contract/
        └── test_chat_api.py     # NEW
```

**Structure Decision**: Extend existing backend with new modules for chat functionality. Agent code lives in `agents/` directory, conversation persistence in standard `models/crud/schemas` structure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat Request                              │
│  POST /api/chat { user_id, conversation_id?, message }          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Chat Router                                 │
│  1. Validate JWT (get user_id)                                  │
│  2. Load/create conversation from DB                            │
│  3. Append user message to history                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Chat Service                                  │
│  1. Build conversation history for agent                        │
│  2. Initialize agent with MCP tools                             │
│  3. Run agent with user message                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Chat Orchestrator (OpenAI Agent)                   │
│  1. Interpret user intent                                       │
│  2. Invoke MCP tools as needed                                  │
│  3. Generate user-friendly response                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │   MCP Server     │  │  Response        │
         │  (Task Tools)    │  │  Generation      │
         │  - add_task      │  │                  │
         │  - list_tasks    │  │                  │
         │  - complete_task │  │                  │
         │  - update_task   │  │                  │
         │  - delete_task   │  │                  │
         └──────────────────┘  └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Chat Service                                  │
│  4. Save assistant message to conversation                      │
│  5. Return ChatResponse                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Chat Response                               │
│  { conversation_id, message, actions_taken }                    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Agent Configuration

The chat-orchestrator agent will be configured with:
- **Model**: GPT-4o (or configurable via environment)
- **Instructions**: Task management specialist prompt
- **Tools**: MCP tools via MCPServerStreamableHttp connection
- **No handoffs**: Single agent handles all requests
- **Implementation**: Follow `@.claude/skills/openai-agent-sdk-integration` patterns

### 2. MCP Integration Pattern

> **Skill Reference**: See `.claude/skills/openai-agent-sdk-integration/references/mcp-server-patterns.md` for complete patterns

```python
# Agent connects to existing MCP server via HTTP
# Pattern from openai-agent-sdk-integration skill
async with MCPServerStreamableHttp(
    params=MCPServerStreamableHttpParams(url=MCP_SERVER_URL),
    name="TaskMCPClient",
    cache_tools_list=True  # Cache tools for performance
) as mcp_server:
    agent = Agent(
        name="chat-orchestrator",
        instructions=SYSTEM_PROMPT,
        mcp_servers=[mcp_server],
        model=OpenAIChatCompletionsModel(model="gpt-4o", openai_client=client)
    )
    result = await Runner.run(agent, user_message)
```

### 3. Conversation Persistence

- Conversations stored in PostgreSQL with SQLModel
- Messages ordered by timestamp
- 30-day retention with cleanup job
- User-scoped (user_id foreign key)

### 4. Stateless Request Handling

Each request:
1. Loads full conversation history from DB
2. Builds agent input from history
3. Runs agent (stateless)
4. Saves new messages to DB
5. Returns response

No in-memory state between requests.

## Existing MCP Tools Available

| Tool | Description | Parameters |
|------|-------------|------------|
| `add_task` | Create a new task | title, description, authorization |
| `list_tasks` | Get all user's tasks | authorization |
| `complete_task` | Toggle task completion | task_id, authorization |
| `update_task` | Update task details | task_id, title?, description?, completed?, authorization |
| `delete_task` | Delete a task | task_id, authorization |
| `get_task_stats` | Get task statistics | authorization |
| `bulk_update_tasks` | Update multiple tasks | task_ids, title?, description?, completed?, authorization |

## Agent System Prompt

```text
You are a helpful task management assistant. Your role is to help users manage their tasks through natural conversation.

You can:
- Create new tasks when users want to add something to their list
- Show users their current tasks
- Mark tasks as complete when users finish them
- Update task details (title, description)
- Delete tasks users no longer need

Guidelines:
1. Be friendly and conversational
2. Confirm actions after completing them
3. If a request is unclear, ask for clarification
4. For task references, try to match by title or ID
5. If multiple tasks match, list them and ask which one
6. For non-task requests, politely redirect to task management

Examples of what you can help with:
- "Add a task to buy groceries"
- "What's on my list?"
- "Mark the groceries task as done"
- "Delete task 5"
- "Change 'buy milk' to 'buy almond milk'"
```

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale |
|----------|-----------|
| Single agent (no handoffs) | Simplest approach for scope; task management is single-domain |
| HTTP transport for MCP | Already configured in existing server; proven pattern |
| SQLModel for conversations | Consistent with existing codebase |

## Implementation Phases

### Phase 0: Research (Complete)
- [x] Analyze existing MCP server structure
- [x] Document available MCP tools
- [x] Define integration approach

### Phase 1: Design (This Plan)
- [x] Define data models (Conversation, Message)
- [x] Design API contract (POST /api/chat)
- [x] Plan agent configuration

### Phase 2: Tasks (Next - /sp.tasks)
- [ ] Generate implementation tasks
- [ ] Create test specifications
- [ ] Define acceptance criteria

## Dependencies & Risks

| Dependency | Status | Risk |
|------------|--------|------|
| OpenAI Agents SDK | Available | Low - well-documented |
| Existing MCP Server | ✅ Operational | Low - tested |
| PostgreSQL | ✅ Operational | Low - existing |
| OpenAI API | Required | Medium - API key needed, costs |
| openai-agent-sdk-integration skill | ✅ Available | Low - comprehensive patterns |

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement Conversation/Message models
3. Create chat endpoint
4. **Configure OpenAI Agent with MCP tools using `@.claude/skills/openai-agent-sdk-integration`**
5. Implement conversation persistence
6. Add error handling and edge cases
7. Write tests

## Implementation Notes

When implementing the chat-orchestrator agent (`backend/app/agents/chat_orchestrator.py`):

1. **Read the skill first**: `@.claude/skills/openai-agent-sdk-integration/SKILL.md`
2. **Reference patterns from**:
   - `references/agent-patterns.md` - Agent creation and Runner usage
   - `references/mcp-server-patterns.md` - HTTP transport connection
   - `references/tool-filtering.md` - If tool filtering is needed
   - `references/guardrails-tracing.md` - For input/output validation

The skill contains production-tested patterns for OpenAI Agents SDK with MCP integration.
