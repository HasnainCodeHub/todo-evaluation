# Quickstart: AI Chatbot Integration

**Feature**: 009-ai-chatbot-integration
**Date**: 2026-02-06

## Prerequisites

- Python 3.13+
- Existing MCP server running (`backend/app/mcp_server.py`)
- PostgreSQL database (Neon) with existing Task table
- OpenAI API key

## Environment Setup

Add to `backend/.env`:

```bash
# Existing variables
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=<shared-secret-with-frontend>
JWT_ALGORITHM=HS256

# New variables for AI chatbot
OPENAI_API_KEY=<your-openai-api-key>
MCP_SERVER_URL=http://localhost:8000/mcp
CHAT_MODEL=gpt-4o
CHAT_CONTEXT_LIMIT=20
```

## Installation

```bash
cd backend

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install new dependencies
pip install openai-agents httpx

# Update requirements.txt
pip freeze > requirements.txt
```

## Database Migration

Run the SQL migration to create conversation tables:

```sql
-- Create conversation table
CREATE TABLE conversation (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_user_id ON conversation(user_id);
CREATE INDEX idx_conversation_updated_at ON conversation(updated_at);

-- Create message table
CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_conversation_id ON message(conversation_id);
```

## File Creation Order

Create files in this order to satisfy dependencies:

1. **Models** (no dependencies):
   - `backend/app/models/conversation.py`

2. **Schemas** (depends on models):
   - `backend/app/schemas/chat.py`

3. **CRUD** (depends on models, database):
   - `backend/app/crud/conversation.py`

4. **Agent** (depends on config):
   - `backend/app/agents/__init__.py`
   - `backend/app/agents/chat_orchestrator.py`

5. **Service** (depends on agent, CRUD):
   - `backend/app/services/chat_service.py`

6. **Router** (depends on service, auth):
   - `backend/app/routers/chat.py`

7. **Main** (register router):
   - Update `backend/app/main.py`

## Verification Steps

### 1. Check MCP Server

```bash
# Verify MCP server is running
curl http://localhost:8000/mcp/list_tools
```

### 2. Run Unit Tests

```bash
cd backend
pytest tests/unit/test_chat_service.py -v
```

### 3. Run Integration Tests

```bash
pytest tests/integration/test_chat_flow.py -v
```

### 4. Manual Test

```bash
# Get JWT token (via frontend or test script)
TOKEN="your-jwt-token"

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me my tasks"}'
```

## Expected Response

```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Here are your tasks:\n1. Buy groceries (pending)\n2. Call mom (completed)",
  "actions_taken": ["list_tasks"],
  "created_at": "2026-02-06T10:30:00Z"
}
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `OPENAI_API_KEY not set` | Missing env var | Add to `.env` file |
| `MCP server unavailable` | Server not running | Start MCP server first |
| `Token expired` | JWT expired | Get fresh token from `/api/auth/jwt` |
| `Conversation not found` | Invalid ID | Start new conversation (omit `conversation_id`) |

## Development Server

```bash
# Start backend with chat endpoint
cd backend
uvicorn app.main:app --reload --port 8000

# In another terminal, verify chat works
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to test the chat feature"}'
```
