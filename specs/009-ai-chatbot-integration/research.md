# Research: AI Chatbot Integration

**Feature**: 009-ai-chatbot-integration
**Date**: 2026-02-06

## Overview

This document captures research findings for implementing the AI chatbot layer with OpenAI Agents SDK and MCP Server integration.

## 1. OpenAI Agents SDK Integration

### Decision
Use OpenAI Agents SDK with `MCPServerStreamableHttp` transport to connect to the existing MCP server.

### Rationale
- Native MCP support in OpenAI Agents SDK
- HTTP transport already configured in existing MCP server (`stateless_http=True`)
- Consistent with existing architecture patterns
- Well-documented with clear examples

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Direct tool function calls | Bypasses MCP abstraction; violates architecture constraint |
| LangChain agents | Additional dependency; SDK already provides needed functionality |
| Custom agent implementation | Reinventing the wheel; SDK handles complexity |

### Implementation Pattern

```python
from agents import Agent, Runner, OpenAIChatCompletionsModel
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def run_chat_agent(user_message: str, history: list) -> str:
    mcp_params = MCPServerStreamableHttpParams(url=MCP_SERVER_URL)

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="TaskMCPClient",
        cache_tools_list=True
    ) as mcp_server:
        agent = Agent(
            name="chat-orchestrator",
            instructions=SYSTEM_PROMPT,
            mcp_servers=[mcp_server],
            model=OpenAIChatCompletionsModel(model="gpt-4o", openai_client=client)
        )

        # Build input from history + new message
        input_messages = history + [user_message]
        result = await Runner.run(agent, input_messages)

        return result.final_output
```

## 2. Conversation Persistence Strategy

### Decision
Store conversations in PostgreSQL using SQLModel, consistent with existing Task model patterns.

### Rationale
- Leverages existing database infrastructure
- SQLModel integration already established
- User-scoped queries follow existing patterns
- 30-day retention aligns with clarified requirements

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Redis for sessions | Additional infrastructure; overkill for simple history |
| In-memory cache | Violates stateless constraint; lost on restart |
| File-based storage | Not scalable; complicates Vercel deployment |

### Data Model

```python
class Conversation(SQLModel, table=True):
    id: str = Field(primary_key=True)  # UUID
    user_id: str = Field(index=True)
    created_at: datetime
    updated_at: datetime  # For retention calculation

class Message(SQLModel, table=True):
    id: int = Field(primary_key=True)
    conversation_id: str = Field(foreign_key="conversation.id", index=True)
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime
```

## 3. MCP Tool Authentication

### Decision
Pass JWT authorization header through tool calls for user context.

### Rationale
- Existing MCP tools already expect `authorization` parameter
- Maintains user scoping at tool level
- No changes needed to existing MCP server

### Implementation

The chat service will:
1. Extract JWT from incoming request
2. Pass JWT to agent context
3. Agent passes JWT when invoking MCP tools

```python
# MCP tools already handle auth
@mcp_app.tool(name="add_task", ...)
async def add_task(title: str, authorization: str = Header(None)):
    current_user = get_authenticated_user_from_header(authorization)
    # ... creates task with current_user.user_id
```

## 4. Error Handling Strategy

### Decision
Catch MCP tool errors and convert to user-friendly messages.

### Rationale
- Spec requires user-friendly error messages
- Agent shouldn't expose technical details
- Graceful degradation for MCP unavailability

### Error Categories

| Error Type | User Message |
|------------|--------------|
| MCP Server Unavailable | "I'm having trouble completing that action right now. Please try again." |
| Task Not Found | "I couldn't find that task. Could you check the task name or ID?" |
| Authentication Failed | "Your session has expired. Please sign in again." |
| Invalid Input | "I didn't quite understand that. Could you rephrase?" |

## 5. Agent System Prompt Design

### Decision
Use a focused, task-management-specific system prompt.

### Rationale
- Clear boundaries prevent off-topic responses
- Examples guide natural language understanding
- Explicit guidelines for ambiguous inputs

### Prompt Structure

1. **Role definition**: Task management assistant
2. **Capabilities list**: What the agent can do
3. **Guidelines**: How to handle edge cases
4. **Examples**: Sample interactions
5. **Redirect instructions**: How to handle off-topic requests

## 6. Conversation Context Window

### Decision
Load last 20 messages for context (configurable).

### Rationale
- SC-004 requires 20 message context
- Balances context quality vs. token costs
- Prevents excessive history loading

### Implementation

```python
def get_conversation_history(conversation_id: str, limit: int = 20) -> list:
    return session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    ).all()[::-1]  # Reverse to chronological order
```

## 7. Response Format

### Decision
Return structured ChatResponse with message and metadata.

### Rationale
- Frontend needs conversation_id for continuation
- Actions taken useful for debugging/logging
- Consistent with existing API patterns

### Response Schema

```python
class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    actions_taken: list[str] | None = None
    created_at: datetime
```

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Agent Framework | OpenAI Agents SDK |
| MCP Transport | MCPServerStreamableHttp |
| Conversation Storage | PostgreSQL via SQLModel |
| Auth Propagation | JWT passed to MCP tools |
| Error Handling | Catch and convert to friendly messages |
| Context Window | Last 20 messages |
| Response Format | Structured ChatResponse |
