# Quickstart: Chatbot UI Integration (010-chatbot-ui)

**Phase**: 1 — Design
**Date**: 2026-02-18

---

## Prerequisites

- Node.js 18+ and npm
- Frontend running locally (`cd frontend && npm run dev`)
- Backend running locally (`uvicorn app.main:app --reload --port 8000`)
- Valid Better Auth session (sign in at `/signin`)

---

## Setup

### 1. Install ChatKit

```bash
cd frontend
npm install @openai/chatkit-react
```

### 2. Add Environment Variable

Add to `frontend/.env.local`:

```env
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_domain_key_here
```

> For local development, use a placeholder value — ChatKit domain verification
> is enforced primarily in production. The chat UI will still render and route
> through your backend adapter.

### 3. Production Domain Allowlist

1. Go to [platform.openai.com](https://platform.openai.com) → Settings → Organization → Security → Domain Allowlist
2. Add `ai-based-todo.vercel.app`
3. Wait 20–30 minutes for propagation
4. Copy the generated domain key into your Vercel environment variables

---

## Integration Scenarios

### Scenario 1: First Message (New Conversation)

```
User types: "Add a task to buy groceries"
  → ChatPanel sends POST /api/chat { message: "Add a task to buy groceries" }
  → Next.js adapter reads Better Auth session server-side
  → Adapter generates JWT and forwards to FastAPI POST /api/chat
  → FastAPI runs AI agent → MCP tool: add_task → returns { conversation_id, message }
  → Adapter returns response to ChatPanel
  → ChatPanel renders assistant message
  → Frontend saves conversation_id to localStorage["chatConversationId"]
  → Frontend calls tasks.refresh() to update task list panel
```

### Scenario 2: History Restoration on Page Load

```
User opens/refreshes dashboard
  → useConversation hook reads localStorage["chatConversationId"]
  → If present: calls GET /api/conversations/{id} (via chat API client with JWT bridge)
  → On 200: maps server messages to ChatMessage[] and populates state
  → On 404: clears localStorage, sets messages = []
  → On 401: redirects to /signin
  → ChatPanel renders restored conversation
```

### Scenario 3: Continuing a Conversation

```
User (with existing conversation) types: "Show me my tasks"
  → ChatPanel sends POST /api/chat { message: "Show me my tasks", conversation_id: "abc-123" }
  → Adapter forwards conversation_id to FastAPI
  → FastAPI loads conversation history, runs agent
  → Returns updated message in same conversation
  → ChatPanel renders response (scrolls to bottom automatically)
```

### Scenario 4: Session Expiry During Chat

```
Better Auth session expires while user is in chat
  → User submits message
  → Next.js adapter reads session → session invalid
  → Adapter returns 401 { error: "Your session has expired — please log in again" }
  → ChatPanel displays error message inline in conversation
  → After 2s delay, redirects to /signin
```

### Scenario 5: Empty Message Prevention

```
User clicks Send with empty input (or whitespace only)
  → ChatPanel validates input before sending
  → Empty/whitespace input: send button stays disabled OR displays validation message
  → No API call is made (FR-010)
```

---

## Testing Locally

### Full Task Management via Chat

1. Sign in at `http://localhost:3000/signin`
2. Navigate to `http://localhost:3000/dashboard`
3. In the chat panel (right side), type: `"Add a task to review the PR"`
4. Verify the task appears in the task list panel (left/center)
5. Type: `"What are my tasks?"`
6. Verify the assistant lists tasks in the chat response
7. Type: `"Mark review the PR as done"`
8. Verify the task shows as completed in the task list
9. Type: `"Delete it"`
10. Verify the task is removed from the task list

### Conversation Persistence

1. Send a few messages in the chat
2. Note the task list has been updated
3. Refresh the browser (F5)
4. Verify the chat conversation history is restored
5. Verify the task list still shows all tasks

### Error Handling

1. Stop the backend server (`Ctrl+C` on the uvicorn process)
2. Try sending a message in the chat
3. Verify a user-friendly error appears (not a stack trace)
4. Restart the backend and verify normal operation resumes

---

## File Reference

| File | Description |
|------|-------------|
| `frontend/app/api/chat/route.ts` | Next.js adapter — bridges ChatKit to FastAPI |
| `frontend/components/chat/ChatPanel.tsx` | ChatKit wrapper — side panel UI component |
| `frontend/hooks/useConversation.ts` | localStorage + history restoration hook |
| `frontend/types/chat.ts` | TypeScript interfaces for chat entities |
| `frontend/app/dashboard/page.tsx` | Modified to include ChatPanel in 3-col layout |
| `frontend/.env.local` | `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` added |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Chat messages not appearing | Backend not running | Start `uvicorn app.main:app --reload` |
| "Session expired" on every message | JWT_SECRET mismatch | Ensure `BETTER_AUTH_SECRET` matches `JWT_SECRET` in backend |
| Task list not updating after chat | `tasks.refresh()` not called | Verify `onResponse` callback calls `tasks.refresh()` in ChatPanel |
| Conversation not restored on refresh | localStorage key mismatch | Check `chatConversationId` key in browser DevTools → Application → localStorage |
| Domain error in production | Domain not in allowlist | Add `ai-based-todo.vercel.app` to OpenAI domain allowlist; wait 20–30 min |
