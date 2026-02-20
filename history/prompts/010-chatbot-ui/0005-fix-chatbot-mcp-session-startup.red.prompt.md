---
id: "0005"
title: fix-chatbot-mcp-session-startup
stage: red
date: 2026-02-18
surface: agent
model: claude-sonnet-4-6
feature: 010-chatbot-ui
branch: 010-chatbot-ui
user: Hasnain Ali
command: /sp.phr
labels: [red, debugging, mcp, fastmcp, lifespan, pydantic-settings, asgi-middleware, chatbot]
links:
  spec: specs/010-chatbot-ui/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - backend/app/config.py
  - backend/.env
  - backend/app/middleware/mcp_auth_middleware.py
  - backend/app/main.py
tests:
  - none
---

## Prompt

`/sp.phr` — Record the chatbot debugging session for the fix of "I'm sorry, I encountered an unexpected issue. Please try again in a moment." and the subsequent MCP session manager startup failures.

User reported: chatbot answers only "I'm sorry, I encountered an unexpected issue. Please try again in a moment." for every message. Subsequent terminal errors showed:
1. `pydantic_core._pydantic_core.ValidationError` at `Settings()` instantiation
2. `RuntimeError: Task group is not initialized. Make sure to use run().` from `mcp/server/streamable_http_manager.py`

## Response snapshot

Diagnosed and fixed four bugs in sequence:
1. `backend/.env`: `CHAT_MODEL=gemini-2.5-flash` → `gemini-2.0-flash` (invalid model name caused API failure → generic error)
2. `backend/app/config.py`: `@property mcp_server_url` conflicts with Pydantic v2 metaclass → replaced with `Field(default_factory=_default_mcp_server_url)`
3. `backend/app/middleware/mcp_auth_middleware.py`: `BaseHTTPMiddleware` does not forward lifespan events → converted to pure ASGI middleware
4. `backend/app/main.py`: Starlette does not auto-forward lifespan to mounted sub-apps → manually triggered FastMCP's ASGI lifespan via `asyncio.create_task` in the FastAPI lifespan handler

## Outcome

- ✅ Impact: Backend server starts cleanly with `[OK] FastMCP session manager started`; chat messages now route through the agent to MCP tools correctly
- 🧪 Tests: No automated tests — manual verification via backend logs showing `POST /mcp → 200` after fix
- 📁 Files: 4 files modified (config.py, .env, mcp_auth_middleware.py, main.py)
- 🔁 Next prompts: Run full end-to-end chat test; commit and push all changes when ready; deploy to Vercel and verify production MCP URL auto-detection works
- 🧠 Reflection: Starlette mounted sub-app lifespan is NOT automatically forwarded by the parent Router — this is a common footgun when embedding Starlette/FastMCP apps inside FastAPI. The `BaseHTTPMiddleware` wrapper compounds the problem by also blocking lifespan events. Pure ASGI middleware + explicit lifespan bootstrapping is the correct pattern for FastMCP-in-FastAPI integration.

## Evaluation notes (flywheel)

- Failure modes observed: Four compounding bugs caused the same surface symptom ("unexpected issue" message) — the generic `except Exception` handler in `chat_service.py` masked the root cause. Each fix revealed the next bug layer. Debugging required reading traceback output carefully across multiple restart cycles.
- Graders run and results (PASS/FAIL): Manual — server starts without error, `[OK] FastMCP session manager started` logged, `POST /mcp` returns 200
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add structured error logging in `chat_service.py` that exposes the actual exception class and message in the chat response during development mode (`settings.debug=True`), so future agent failures are immediately visible without checking server logs
