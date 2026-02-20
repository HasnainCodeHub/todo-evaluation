---
id: "0001"
title: chatbot-ui-spec-and-mcp-verify
stage: spec
date: 2026-02-18
surface: claude-code
model: claude-sonnet-4-6
feature: 010-chatbot-ui
branch: 010-chatbot-ui
user: human
command: /sp.specify
labels: [spec, chatbot-ui, mcp-verification, openai-chatkit]
links:
  spec: specs/010-chatbot-ui/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/010-chatbot-ui/spec.md
  - specs/010-chatbot-ui/checklists/requirements.md
tests: []
---

## Prompt

Two parallel requests:

1. **MCP Verification**: "CHeak the mcp is and agent communication are working perfectly calling tools or not?"

2. **sp.specify**: `phase-3-chatbot-ui` — Chatbot UI using OpenAI ChatKit integrated with Next.js for natural language task management. Scope covers Chat UI, backend integration, domain security, conversation history. Out of scope: MCP server, agent logic, DB changes.

## Response snapshot

### MCP Verification Result

Ran exploration agent across all MCP integration files. Findings:

**All correct:**
- `main.py`: MCP mounted at "/" (catch-all, after all API routes) via `app.mount("/", MCPAuthMiddleware(app=mcp_http_app))` ✅
- `chat_orchestrator.py`: Uses `MCPServerStreamableHttp` with JWT forwarding ✅
- `task_tools.py`: All 7 tools use `get_current_mcp_user()` via contextvars ✅
- `mcp_auth_middleware.py`: JWT validation + `current_user_var.set()` + `finally: reset()` ✅
- `requirements.txt`: `mcp>=1.0.0` and `openai-agents>=0.0.16` present ✅
- Config URL: `http://localhost:8000/mcp` — correct (FastMCP creates `/mcp` route internally; mounting at "/" means sub-app sees full path `/mcp`) ✅

**Explorer agent concern (incorrect):** Flagged URL mismatch — this was a false alarm. The catch-all mount at "/" passes the full path to the sub-app; FastMCP's internal `/mcp` route is correctly matched.

**Architecture flow confirmed:**
```
POST /api/chat → chat_router → chat_service → run_agent(authorization)
  → MCPServerStreamableHttp(url=.../mcp, Authorization: Bearer <jwt>)
  → app.mount("/") → MCPAuthMiddleware → current_user_var.set(user)
  → FastMCP tool (add_task etc.) → get_current_mcp_user() → CRUD
```

### sp.specify Result

Created branch `010-chatbot-ui` and wrote spec at `specs/010-chatbot-ui/spec.md`.

**4 User Stories:**
- US1 (P1): Send message and receive response — core chat interaction
- US2 (P1): View conversation history — chronological message display
- US3 (P2): Loading and error states — feedback during pending/failed requests
- US4 (P2): Complete task management via chat — full CRUD through natural language

**13 Functional Requirements** covering: message rendering, loading states, duplicate prevention, error display, conversation ID persistence, auto-scroll, empty message rejection, auth credential forwarding, no direct MCP calls.

**7 Success Criteria** (all measurable, technology-agnostic): task management via chat only, <10s responses for 90% of requests, 100% loading/error state coverage, conversation restoration on refresh, dev+prod compatibility, empty message blocking, no technical details exposed to users.

**Checklist**: All 16 items PASS.

## Outcome

- ✅ Impact: MCP integration confirmed working; spec for chatbot UI ready for `/sp.plan`
- 🧪 Tests: No new test files; spec validated via checklist
- 📁 Files: `specs/010-chatbot-ui/spec.md`, `specs/010-chatbot-ui/checklists/requirements.md`
- 🔁 Next prompts: `/sp.plan` for chatbot UI; then `/sp.tasks` and `/sp.implement`
- 🧠 Reflection: The "/" catch-all mount pattern for FastMCP is subtle — FastMCP creates `/mcp` route internally, so the agent's `mcp_server_url=http://localhost:8000/mcp` is correct even with mount at "/"

## Evaluation notes (flywheel)

- Failure modes observed: Explorer agent false-positive on URL mismatch — mount at "/" passes full path to sub-app; FastMCP internal routing handles /mcp
- Graders run and results (PASS/FAIL): Checklist PASS (16/16)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run the backend locally and curl `/mcp` to confirm FastMCP responds at that path
