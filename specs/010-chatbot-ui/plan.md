# Implementation Plan: Chatbot UI

**Branch**: `010-chatbot-ui` | **Date**: 2026-02-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-chatbot-ui/spec.md`

---

## Summary

Add a ChatKit-powered chat side panel to the existing Next.js 15 dashboard that routes all messages through the backend FastAPI chat endpoint. Users interact with the AI agent via natural language and see task list updates in real time. A Next.js API adapter route bridges ChatKit's message format to the FastAPI `POST /api/chat` endpoint, preserving the Bridge authentication pattern. Conversation history persists via `localStorage` and is restored on page load from the backend.

---

## Technical Context

**Language/Version**: TypeScript 5.7, Next.js 15.1 (App Router), React 18.3
**Primary Dependencies**: `@openai/chatkit-react` (new), `better-auth` (existing), `jsonwebtoken` (existing), Tailwind CSS (existing)
**Storage**: Neon PostgreSQL via FastAPI backend (conversation history); `localStorage` on client (conversation ID only)
**Testing**: Jest + React Testing Library (frontend unit); pytest (backend — no changes needed)
**Target Platform**: Web, Desktop + Mobile responsive, Vercel deployment
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Chat response displayed within 10 seconds for 90% of requests (SC-002)
**Constraints**: No direct MCP/DB calls from frontend; must use ChatKit; stateless backend interaction; conversation ID stored client-side only
**Scale/Scope**: Single authenticated user, single active conversation per session

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| No direct DB access from frontend | ✅ PASS | All data flows through FastAPI endpoints |
| Authentication required | ✅ PASS | Better Auth session + JWT bridge enforced |
| User-scoped data | ✅ PASS | `user_id` from JWT in all backend calls |
| No secrets exposed to browser | ✅ PASS | JWT generated server-side in adapter route |
| Single backend endpoint for AI | ✅ PASS | All chat routes through `POST /api/chat` |
| No direct MCP tool calls from frontend | ✅ PASS | MCP invoked by backend agent only |

No constitution violations. Proceed.

---

## Project Structure

### Documentation (this feature)

```text
specs/010-chatbot-ui/
├── plan.md              ← This file
├── research.md          ← Phase 0 output (ChatKit integration decisions)
├── data-model.md        ← Phase 1 output (chat entities and type contracts)
├── quickstart.md        ← Phase 1 output (integration scenarios)
├── contracts/
│   └── chat-ui.yaml     ← Phase 1 output (OpenAPI contract)
└── tasks.md             ← Phase 2 output (/sp.tasks — NOT created here)
```

### Source Code Changes

```text
frontend/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          ← NEW: Next.js adapter (ChatKit → FastAPI bridge)
│   └── dashboard/
│       └── page.tsx              ← MODIFIED: Add ChatPanel to 3-col layout
│
├── components/
│   └── chat/
│       ├── ChatPanel.tsx         ← NEW: ChatKit wrapper side panel component
│       └── index.ts              ← NEW: Barrel export
│
├── hooks/
│   ├── useConversation.ts        ← NEW: localStorage + history restoration
│   └── index.ts                  ← MODIFIED: Export useConversation
│
└── types/
    ├── chat.ts                   ← NEW: ChatMessage, ConversationState, request/response types
    └── index.ts                  ← MODIFIED: Re-export from chat.ts
```

**No backend changes required.** All backend endpoints already exist.

---

## Architecture

### Request Flow

```
User types message in ChatPanel
  ↓
ChatKit component (or useConversation hook)
  ↓
POST /api/chat (Next.js adapter — server-side)
  → reads Better Auth session
  → generates JWT (same logic as /api/auth/jwt/route.ts)
  → forwards to FastAPI POST /api/chat with Authorization: Bearer <jwt>
  ↓
FastAPI chat router
  → validates JWT
  → process_chat() → run_agent() → MCP tools → CRUD
  → returns { conversation_id, message, actions_taken, created_at }
  ↓
Next.js adapter maps response → returns to ChatPanel
  ↓
ChatPanel renders assistant message
  ↓
Frontend saves conversation_id to localStorage["chatConversationId"]
Frontend calls tasks.refresh() to update task list panel
```

### History Restoration Flow

```
Dashboard page mounts
  ↓
useConversation hook reads localStorage["chatConversationId"]
  ↓ (if present)
apiClient.getConversation(id)
  → GET {NEXT_PUBLIC_API_URL}/api/conversations/{id}
  → Authorization: Bearer <jwt from bridge>
  ↓
On 200: map server messages → set messages state
On 404: clear localStorage, start fresh
On 401: display session expired → redirect to /signin
On error: start fresh silently
```

### Dashboard Layout Change

**Current** (3-column grid):
```
[Task Form 1/3] [Task List 2/3]
```

**New** (3-column grid, equal columns):
```
[Task Form 1/3] [Task List 1/3] [Chat Panel 1/3]
```

Implementation: Change `lg:col-span-2` on task list `<div>` to `lg:col-span-1`, add new `lg:col-span-1` div containing `<ChatPanel>`.

---

## Key Implementation Details

### 1. Next.js Adapter Route (`app/api/chat/route.ts`)

- Runtime: `export const runtime = 'nodejs'` (required for Better Auth session access)
- Reads Better Auth session using `auth.api.getSession({ headers: request.headers })`
- Generates JWT using same `jose` library as `app/api/auth/jwt/route.ts`
- Forwards to `${process.env.NEXT_PUBLIC_API_URL}/api/chat`
- Handles FastAPI 401 → returns 401 with user-friendly message to ChatPanel
- Does NOT stream — returns complete response

### 2. ChatPanel Component (`components/chat/ChatPanel.tsx`)

- Uses `@openai/chatkit-react` — configured with `url='/api/chat'` and `domainKey={process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY}`
- Manages `conversationId` state via `useConversation` hook
- Passes `conversationId` in each request body
- Saves new `conversationId` from response to localStorage
- Calls `onTasksChanged()` prop callback after each assistant response (triggers `tasks.refresh()`)
- Renders error messages inline in conversation (no toast — per spec)
- Auto-scrolls to latest message (FR-008)

### 3. useConversation Hook (`hooks/useConversation.ts`)

- Reads `localStorage.getItem('chatConversationId')` on mount
- Calls `GET /api/conversations/{id}` if ID found
- Returns `{ conversationId, setConversationId, messages, setMessages, isRestoring }`
- Sets messages to empty array on 404 (fresh start)
- Redirects to `/signin` on 401 (using `window.location.href = '/signin'`)

### 4. Chat API Client (`lib/api/chatClient.ts`)

Following existing `client.ts` pattern exactly:
- Same JWT bridge (`getJWT()` via `/api/auth/jwt`)
- `getConversation(id: string)`: GET `/api/conversations/{id}`
- Throws `SESSION_INVALID` on 401 (handled by `useConversation`)

### 5. Task List Refresh After Chat

The `DashboardContent` component passes `tasks.refresh` as an `onTasksChanged` prop to `<ChatPanel>`. After each successful AI response, ChatPanel calls this prop to refresh the task list so changes made by the AI agent appear immediately (FR from US4).

---

## Environment Variables

| Variable | Where | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` | `frontend/.env.local` + Vercel | Yes (prod) | ChatKit domain verification |
| `NEXT_PUBLIC_API_URL` | Already set | Existing | Backend API URL |
| `BETTER_AUTH_SECRET` | Already set | Existing | JWT signing in adapter |

---

## Dependencies

### New

```json
{
  "dependencies": {
    "@openai/chatkit-react": "latest"
  }
}
```

### No Backend Changes

All required backend endpoints exist:
- `POST /api/chat` ✅
- `GET /api/conversations/{id}` ✅

---

## Complexity Tracking

No constitution violations. No complexity justifications required.
