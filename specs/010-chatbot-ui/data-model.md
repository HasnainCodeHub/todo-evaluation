# Data Model: Chatbot UI (010-chatbot-ui)

**Phase**: 1 — Design
**Date**: 2026-02-18
**Spec**: [specs/010-chatbot-ui/spec.md](./spec.md)
**Research**: [research.md](./research.md)

---

## Frontend-Owned Entities

These entities exist only on the client side and are not persisted to any database.

### ChatMessage (UI State)

Represents a single rendered message in the chat panel.

```typescript
interface ChatMessage {
  id: string           // Locally generated UUID or server message ID
  role: 'user' | 'assistant'
  content: string      // Message text
  timestamp: Date      // For display ordering and timestamps
  isLoading?: boolean  // True while awaiting response (assistant placeholder)
  isError?: boolean    // True if this message represents an error
}
```

**Validation rules**:
- `content` must be non-empty for user messages (FR-010)
- `content` must not be whitespace-only for user messages (FR-010)
- Maximum content length: 10,000 characters (matches backend `ChatRequest.message`)

**State transitions**:
```
[user types] → ChatMessage{role:'user', content} added to list
             → ChatMessage{role:'assistant', isLoading:true} added (placeholder)
             → [response arrives] → placeholder replaced with real content
             → [error occurs] → placeholder replaced with ChatMessage{isError:true}
```

---

### ConversationState (UI State)

Tracks the ongoing conversation session in the chat panel.

```typescript
interface ConversationState {
  conversationId: string | null  // null = no conversation started yet
  messages: ChatMessage[]        // Ordered list of all messages
  isLoading: boolean             // True while waiting for assistant response
  error: string | null           // User-friendly error message or null
}
```

**State transitions**:
- `conversationId: null` → User sends first message → backend returns `conversation_id` → stored in state AND localStorage
- `messages: []` → Page loads with stored `conversationId` → `GET /api/conversations/{id}` → messages populated
- `isLoading: false` → User submits → `isLoading: true` → response arrives → `isLoading: false`

---

### LocalStorage Schema

Key-value entries managed by the frontend:

| Key | Type | Value | Lifetime |
|-----|------|-------|----------|
| `chatConversationId` | `string` | UUID of the active conversation | Until cleared or conversation deleted |

**Lifecycle rules**:
- Set after the first successful `POST /api/chat` response that includes `conversation_id`
- Read on page load to attempt history restoration
- Cleared if `GET /api/conversations/{id}` returns 404 (conversation deleted server-side)
- Never cleared on page refresh or browser close (persists across browser restarts per FR-007)

---

## Backend-Owned Entities (Read-Only from Frontend)

These entities live in the database and are accessed only through backend endpoints.

### Conversation

```typescript
// As returned by GET /api/conversations/{id}
interface ConversationDetail {
  id: string            // UUID — matches localStorage chatConversationId
  created_at: string    // ISO 8601 datetime
  updated_at: string    // ISO 8601 datetime
  messages: ServerMessage[]
}

interface ServerMessage {
  id: number            // Sequential database ID
  role: 'user' | 'assistant'
  content: string
  created_at: string    // ISO 8601 datetime
}
```

**Mapping to frontend ChatMessage**:
```typescript
const mapServerMessage = (msg: ServerMessage): ChatMessage => ({
  id: String(msg.id),
  role: msg.role,
  content: msg.content,
  timestamp: new Date(msg.created_at),
})
```

---

## API Data Contracts

### POST /api/chat (via adapter)

**Request** (sent by ChatKit to Next.js adapter):
```typescript
interface ChatRequest {
  message: string           // Non-empty user message
  conversation_id?: string  // Omit on first message; include on all subsequent
}
```

**Response** (returned by adapter to ChatKit):
```typescript
interface ChatResponse {
  conversation_id: string  // Always present — store in localStorage
  message: string          // Assistant response text
  actions_taken?: string[] // Optional list of MCP actions (for display)
  created_at: string       // ISO 8601 datetime
}
```

### GET /api/conversations/{id} (for history restoration)

**Request**: No body. JWT in `Authorization: Bearer` header.

**Response** (on success):
```typescript
interface ConversationWithMessages {
  id: string
  created_at: string
  updated_at: string
  messages: ServerMessage[]  // Ordered chronologically
}
```

**Error cases handled by frontend**:
| Status | Frontend Behavior |
|--------|------------------|
| 200 | Populate `messages` state from response |
| 404 | Clear localStorage `chatConversationId`; start fresh |
| 401 | Display session expired message; redirect to login |
| Network error | Start fresh silently (per spec edge case) |

---

## Type Definitions Location

```text
frontend/types/chat.ts — All chat-related TypeScript interfaces
frontend/types/index.ts — Re-exports from chat.ts
```

No changes needed to `frontend/types/task.ts` (task types are unchanged).
