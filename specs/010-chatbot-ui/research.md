# Research: Chatbot UI (010-chatbot-ui)

**Phase**: 0 — Research
**Date**: 2026-02-18
**Spec**: [specs/010-chatbot-ui/spec.md](./spec.md)

---

## 1. ChatKit Integration Approach

### Decision: Custom API Integration (not Hosted)

- **Chosen**: `@openai/chatkit-react` with custom backend URL — all messages route through our FastAPI `/api/chat` endpoint.
- **Rationale**: We own the AI model and MCP orchestration. The hosted mode (ChatKit calls OpenAI directly) would bypass our backend agent, violate FR-013, and expose OpenAI keys. The custom mode uses ChatKit purely as a UI rendering library while keeping all AI logic server-side.
- **Alternatives considered**:
  - Hosted mode (`getClientSecret`): Rejected — frontend would call OpenAI directly, bypassing MCP.
  - Custom chat UI (no ChatKit): Rejected — spec requires ChatKit ("Must use OpenAI ChatKit").

### ChatKit Configuration Summary

| Property | Value |
|----------|-------|
| `url` | Next.js API route `/api/chat` (adapter that proxies to FastAPI) |
| `domainKey` | `process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY` |
| Response format | Mapped from FastAPI `ChatResponse` to ChatKit-compatible format |

### Adapter Layer Requirement

ChatKit's custom API mode expects a specific message format. A Next.js API route at `app/api/chat/route.ts` acts as the adapter:
1. Receives ChatKit's message payload (includes conversation state)
2. Extracts JWT from Better Auth session (server-side, no bridge round-trip needed)
3. Forwards to FastAPI `POST /api/chat` with JWT in `Authorization` header
4. Maps `ChatResponse { conversation_id, message }` to ChatKit-compatible format
5. Returns streaming or non-streaming response to ChatKit

---

## 2. Domain Security & Environment

### Domain Allowlist (Production)
- **Platform**: platform.openai.com → Settings → Organization → Security → Domain Allowlist
- **Production domain**: `ai-based-todo.vercel.app` (must be added)
- **Propagation time**: 20–30 minutes after adding domain
- **Key variable**: `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` (exposed to browser)

### Local Development
- Localhost cannot be added to the OpenAI domain allowlist
- **Resolution**: Development mode skips domain verification OR uses the ChatKit component in a mock/passthrough mode via an environment check
- For full local testing: use the adapter URL directly (the ChatKit UI still renders; the `domainKey` validation may only enforce in production)

### New Environment Variables

| Variable | Layer | Purpose | Required |
|----------|-------|---------|----------|
| `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` | Client | ChatKit domain verification | Yes (production) |

---

## 3. Conversation History Persistence

### Decision: localStorage + Backend Fetch on Load

- **Storage**: `localStorage.getItem('chatConversationId')` — key `chatConversationId`
- **On page load**: If key exists, call `GET /api/conversations/{id}` to restore messages. If 404 or network error → start fresh (don't block user).
- **On first message**: Backend creates conversation; frontend saves returned `conversation_id` to localStorage.
- **Rationale**: Spec clarification Q3/Q4 — localStorage persists across browser restarts; server-side history is authoritative.

---

## 4. Dashboard Layout Integration

### Decision: Three-Column Layout (Modified)

Current dashboard grid: `lg:grid-cols-3` with `[TaskForm 1col] [TaskList 2col]`.

New layout:
- On desktop (`lg:`): `[TaskForm 1col] [TaskList 1col] [ChatPanel 1col]`
- On tablet (`md:`): Tasks stacked above Chat
- On mobile: Tabbed toggle (Tasks / Chat) or vertically stacked

This requires modifying `app/dashboard/page.tsx` to change `lg:col-span-2` on the task list section to `lg:col-span-1` and add a third column for the ChatPanel component.

### Task List Refresh After Chat

After every AI response, `tasks.refresh()` must be called so the task list reflects any changes the agent made (FR from US4). This requires the `useTasks` hook to be passed to or shared with the chat panel.

---

## 5. Authentication in Chat Requests

### Decision: Server-Side JWT via Next.js API Route

The adapter route at `app/api/chat/route.ts` runs server-side (Node.js runtime) and reads the Better Auth session directly using `auth.api.getSession()` — same pattern as `app/api/auth/jwt/route.ts`. This:
- Avoids a client-side bridge round-trip
- Keeps JWT generation server-side (secure)
- Forwards `Authorization: Bearer <jwt>` to FastAPI

---

## 6. New Frontend Files Required

| File | Purpose |
|------|---------|
| `frontend/app/api/chat/route.ts` | Next.js API adapter between ChatKit and FastAPI |
| `frontend/components/chat/ChatPanel.tsx` | ChatKit wrapper component (side panel UI) |
| `frontend/hooks/useConversation.ts` | localStorage + history restoration logic |
| `frontend/types/chat.ts` | TypeScript types for chat messages and conversation |

### Modified Files

| File | Change |
|------|--------|
| `frontend/app/dashboard/page.tsx` | Add ChatPanel to third grid column; call `tasks.refresh()` after chat |
| `frontend/package.json` | Add `@openai/chatkit-react` dependency |
| `frontend/.env.local` | Add `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` |

---

## 7. Backend Compatibility

All backend endpoints needed by the UI already exist:

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `POST /api/chat` | ✅ Exists | Send message to AI agent |
| `GET /api/conversations/{id}` | ✅ Exists | Restore history on page load |

No backend changes required for this feature.

---

## 8. Key Risk: ChatKit API Format Compatibility

- **Risk**: ChatKit's custom mode may expect a specific request/response format (e.g., OpenAI chat completions schema).
- **Mitigation**: The adapter route (`app/api/chat/route.ts`) handles format translation. If ChatKit sends OpenAI-format messages `[{role, content}]`, the adapter extracts the last user message and `conversation_id` from the session state or request body.
- **Fallback**: If ChatKit does not support fully custom message formats, replace the ChatKit import with ChatKit's lower-level UI primitives (`ChatMessage`, `ChatInput`) while keeping the same component file structure.
