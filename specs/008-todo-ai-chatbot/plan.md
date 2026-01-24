# Implementation Plan: Phase 3 - Todo AI Chatbot

**Branch**: `008-todo-ai-chatbot` | **Date**: 2026-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-todo-ai-chatbot/spec.md`

## Summary

Build an MCP (Model Context Protocol) server that exposes task operations as tools for the AI chatbot. The mcp-server-agent handles all database mutations through stateless, deterministic MCP tools. Development follows incremental one-by-one approach: each tool is developed, tested, and verified before moving to the next.

**Key Architectural Decision**: AI agents (chat-orchestrator) NEVER access the database directly. All task mutations flow exclusively through MCP tools executed by mcp-server-agent.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**:
- FastAPI 0.115.0 (API framework)
- SQLModel 0.0.22 (ORM)
- MCP SDK (Model Context Protocol)
- OpenAI Agents SDK (Agent orchestration)
- PyJWT 2.10.1 (JWT verification)

**Storage**: Neon PostgreSQL (serverless) - existing from Phase 2
**Testing**: pytest with httpx for API testing
**Target Platform**: Vercel (serverless deployment)
**Project Type**: Web application (monorepo: frontend + backend)
**Performance Goals**: <5s response time, 100 concurrent users
**Constraints**: Stateless per request, no streaming, English only
**Scale/Scope**: Single user demo → 100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Stateless Architecture | ✅ PASS | MCP tools are stateless, no in-memory state |
| User Scoping | ✅ PASS | All operations scoped by user_id from JWT |
| Separation of Concerns | ✅ PASS | chat-orchestrator reasons, mcp-server-agent executes |
| Test-First | ✅ PASS | Each tool developed with tests before implementation |
| Incremental Development | ✅ PASS | One tool at a time, verify before next |

## Project Structure

### Documentation (this feature)

```text
specs/008-todo-ai-chatbot/
├── plan.md              # This file
├── research.md          # Phase 0 output - MCP patterns research
├── data-model.md        # Phase 1 output - Entity definitions
├── quickstart.md        # Phase 1 output - Developer onboarding
├── contracts/           # Phase 1 output - MCP tool schemas
│   ├── mcp-tools.md     # Tool definitions
│   └── openapi.yaml     # Chat API contract
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── main.py                    # FastAPI entry (existing)
│   ├── config.py                  # Settings (existing)
│   ├── database.py                # SQLModel engine (existing)
│   ├── models/
│   │   ├── task.py                # Task model (existing)
│   │   ├── conversation.py        # NEW: Conversation model
│   │   └── message.py             # NEW: Message model
│   ├── routers/
│   │   ├── tasks.py               # Task REST API (existing)
│   │   └── chat.py                # NEW: Chat endpoint
│   ├── mcp/                       # NEW: MCP Server module
│   │   ├── __init__.py
│   │   ├── server.py              # MCP server setup
│   │   └── tools/                 # MCP tool implementations
│   │       ├── __init__.py
│   │       ├── base.py            # Base tool patterns
│   │       ├── add_task.py        # Tool: add_task
│   │       ├── list_tasks.py      # Tool: list_tasks
│   │       ├── update_task.py     # Tool: update_task
│   │       ├── complete_task.py   # Tool: complete_task
│   │       └── delete_task.py     # Tool: delete_task
│   ├── agents/                    # NEW: Agent orchestration
│   │   ├── __init__.py
│   │   ├── chat_orchestrator.py   # Reasoning agent
│   │   └── prompts.py             # Agent system prompts
│   ├── crud/
│   │   ├── task.py                # Task CRUD (existing)
│   │   ├── conversation.py        # NEW: Conversation CRUD
│   │   └── message.py             # NEW: Message CRUD
│   └── schemas/
│       ├── task.py                # Task schemas (existing)
│       ├── conversation.py        # NEW: Conversation schemas
│       ├── message.py             # NEW: Message schemas
│       └── chat.py                # NEW: Chat request/response
├── tests/
│   ├── mcp/                       # NEW: MCP tool tests
│   │   ├── test_add_task.py
│   │   ├── test_list_tasks.py
│   │   ├── test_update_task.py
│   │   ├── test_complete_task.py
│   │   └── test_delete_task.py
│   ├── test_chat_endpoint.py      # NEW: Chat API tests
│   └── test_auth.py               # Auth tests (existing)
└── requirements.txt               # Dependencies (update)

frontend/
├── app/
│   ├── chat/                      # NEW: Chat UI page
│   │   └── page.tsx
│   └── api/
│       └── chat/                  # NEW: Chat API route (proxy)
│           └── route.ts
├── components/
│   └── chat/                      # NEW: Chat components
│       ├── ChatInterface.tsx
│       ├── MessageList.tsx
│       ├── MessageInput.tsx
│       └── ConversationSelector.tsx
└── lib/
    └── api/
        └── chat-client.ts         # NEW: Chat API client
```

**Structure Decision**: Extending existing monorepo with new MCP module in backend and chat UI in frontend.

## Development Approach: One Tool at a Time

Per user request, development follows strict sequential order:

### Phase 1: MCP Infrastructure Setup
1. Set up MCP server base structure
2. Define base tool patterns and response formats
3. Create Conversation and Message models

### Phase 2: MCP Tools (Sequential)
Each tool follows: **Define → Test → Implement → Verify**

| Order | Tool | MCP Name | Description |
|-------|------|----------|-------------|
| 1 | Add Task | `add_task` | Create new task with title/description |
| 2 | List Tasks | `list_tasks` | Get user's tasks with optional filter |
| 3 | Complete Task | `complete_task` | Mark task as completed |
| 4 | Update Task | `update_task` | Modify task title/description |
| 5 | Delete Task | `delete_task` | Remove task from database |

### Phase 3: Chat Integration
1. Chat endpoint with conversation persistence
2. chat-orchestrator agent integration
3. Frontend ChatKit integration

## MCP Tool Design Patterns

### Standard Tool Response Format

```python
{
    "success": bool,
    "data": Any | None,
    "error": str | None,
    "confirmation": str,  # Human-friendly message
    "metadata": {
        "tool": str,
        "user_id": str,
        "timestamp": str
    }
}
```

### Tool Implementation Pattern

```python
@mcp_server.tool()
async def tool_name(
    user_id: str,       # ALWAYS REQUIRED - from JWT
    # ... tool-specific params
) -> ToolResponse:
    """
    Tool description for AI agent.

    Args:
        user_id: Authenticated user's ID (required for scoping)
        ...

    Returns:
        ToolResponse with success/error and confirmation message
    """
    try:
        # 1. Validate inputs
        # 2. Execute database operation (user_id scoped)
        # 3. Return structured success response
        return ToolResponse(
            success=True,
            data=result,
            confirmation="Task 'X' created successfully"
        )
    except ValidationError as e:
        return ToolResponse(success=False, error=str(e))
    except NotFoundError as e:
        return ToolResponse(success=False, error=str(e))
```

## Complexity Tracking

No constitution violations to justify.

## Skill Assignments (Reference from Spec)

### mcp-server-agent Skills (for tool implementation)
- mcp-tool-execution
- task-crud-database-layer
- sqlmodel-design
- neon-postgres-integration
- error-handling-confirmation

### chat-orchestrator Skills (for agent integration)
- agent-prompt-behavior
- conversation-state-management
- mcp-tool-execution
- task-decomposition
- error-handling-confirmation

## Next Steps

1. Run `/sp.plan` Phase 0 → Generate `research.md`
2. Run `/sp.plan` Phase 1 → Generate `data-model.md`, `contracts/`
3. Run `/sp.tasks` → Generate task breakdown for incremental development
