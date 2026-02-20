---
id: "0003"
title: chatbot-ui-implementation-plan
stage: plan
date: 2026-02-18
surface: claude-code
model: claude-sonnet-4-6
feature: 010-chatbot-ui
branch: 010-chatbot-ui
user: human
command: /sp.plan
labels: [plan, chatbot-ui, chatkit, nextjs, dashboard-layout]
links:
  spec: specs/010-chatbot-ui/spec.md
  plan: specs/010-chatbot-ui/plan.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/010-chatbot-ui/plan.md
  - specs/010-chatbot-ui/research.md
  - specs/010-chatbot-ui/data-model.md
  - specs/010-chatbot-ui/quickstart.md
  - specs/010-chatbot-ui/contracts/chat-ui.yaml
tests: []
---

## Prompt

`/sp.plan` — Generate implementation plan for `010-chatbot-ui`.

User input:
```
phase-3-chatbot-ui

Purpose:
Define the implementation plan for the Chatbot UI using Next.js and
OpenAI ChatKit, integrated with the existing AI backend and MCP Server.

Architecture Overview:
- Frontend built with Next.js (App Router).
- OpenAI ChatKit used as the chat interface component.
- UI communicates only with the backend chat endpoint.
- Backend handles AI reasoning and MCP tool invocation.

Frontend Structure:
- Chat page component renders ChatKit interface.
- ChatKit is configured using NEXT_PUBLIC_OPENAI_DOMAIN_KEY.
- API client layer handles communication with backend chat endpoint.
- No direct MCP or database calls from frontend.

Backend Integration:
- Frontend sends user messages to backend chat endpoint.
- Backend returns assistant response and conversation_id.
- UI updates conversation state based on backend response.

Authentication & Security:
- User authentication handled before chat interaction.
- JWT token included in backend API calls.
- OpenAI Domain Allowlist configured for production.
- NEXT_PUBLIC_OPENAI_DOMAIN_KEY required for hosted ChatKit.

State Management:
- Conversation state persisted via backend.
- Frontend does not maintain long-term session memory.
- UI reload should restore conversation from backend.

Error Handling:
- Display structured backend errors in user-friendly format.
- Handle loading and failure states gracefully.
- Prevent UI crashes on malformed responses.

Constraints:
- Must use OpenAI ChatKit (no custom chat UI).
- Must use Next.js.
- No direct tool execution from frontend.
- Stateless backend interaction.
```

## Response snapshot

### Phase 0: Research

Explored existing frontend to understand integration points:
- Dashboard uses `grid lg:grid-cols-3` — TaskForm (1 col) + TaskList (2 col)
- `lib/api/client.ts` follows Bridge Pattern (Better Auth → JWT → FastAPI)
- `@openai/chatkit-react` is NOT in package.json — must be added
- All backend endpoints exist: `POST /api/chat`, `GET /api/conversations/{id}`

**Key decisions:**
- ChatKit integration type: **Custom API** (not Hosted) — messages route through our own Next.js adapter, not directly to OpenAI
- New Next.js API route at `app/api/chat/route.ts` acts as adapter between ChatKit format and FastAPI
- Dashboard layout change: `[TaskForm 1/3] [TaskList 1/3] [Chat 1/3]`
- `localStorage["chatConversationId"]` stores conversation ID; restored via `GET /api/conversations/{id}` on page load
- JWT generated server-side in adapter (no extra bridge round-trip)

### Phase 1: Design

**Artifacts produced:**
- `research.md`: ChatKit custom integration, domain allowlist, localStorage, adapter layer design
- `data-model.md`: `ChatMessage`, `ConversationState`, localStorage schema, backend API contracts, type mapping
- `contracts/chat-ui.yaml`: OpenAPI 3.0 for `POST /api/chat` (adapter) and `GET /api/conversations/{id}`
- `quickstart.md`: 5 integration scenarios, local testing guide, troubleshooting table
- `plan.md`: Architecture flow, file listing, env vars, implementation details

**Architecture flow:**
```
ChatKit UI → POST /api/chat (Next.js adapter)
          → reads Better Auth session → generates JWT
          → POST FastAPI /api/chat → AI agent → MCP → CRUD
          → maps response → ChatPanel renders
          → saves conversation_id to localStorage
          → tasks.refresh() updates task list
```

## Outcome

- ✅ Impact: Complete implementation plan ready for `/sp.tasks`; all Phase 0 and Phase 1 artifacts generated
- 🧪 Tests: No test files — plan stage only; API contracts defined in `contracts/chat-ui.yaml`
- 📁 Files: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/chat-ui.yaml`
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown, then `/sp.implement`
- 🧠 Reflection: ChatKit's "custom API" mode routes messages through a Next.js adapter — this satisfies both "must use ChatKit" and "no direct MCP calls from frontend"; no backend changes needed since all endpoints already exist

## Evaluation notes (flywheel)

- Failure modes observed: `setup-plan.sh` and `create-phr.sh` exit code 1 on Windows bash — worked around by using Read/Write tools directly
- Graders run and results (PASS/FAIL): N/A (plan stage)
- Prompt variant (if applicable): Context resumed from compacted session
- Next experiment (smallest change to try): Run `/sp.tasks` to break plan into implementation tasks; verify `@openai/chatkit-react` custom API format matches adapter contract before implementing
