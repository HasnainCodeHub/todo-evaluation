# Tasks: MCP Server for AI Task Management

## Phase 1: Setup
**Goal**: Initialize project structure and dependencies per implementation plan

- [x] T001 Create backend directory structure per plan
- [x] T002 Create requirements.txt with Official MCP SDK, SQLModel, PyJWT, Neon PostgreSQL dependencies
- [x] T003 [P] Initialize git repository in backend directory
- [x] T004 [P] Create Dockerfile for containerization
- [x] T005 [P] Create README.md with project overview

## Phase 2: Foundational
**Goal**: Establish core infrastructure and foundational components required by all user stories

- [x] T006 [P] Create app/config.py with environment configuration for database URL, JWT secret, and algorithm
- [x] T007 [P] Create app/database.py with SQLModel engine and Neon PostgreSQL connection setup
- [x] T008 [P] Create app/models/__init__.py and app/models/task.py with Task SQLModel definition
- [x] T009 [P] Create app/schemas/__init__.py and app/schemas/task.py with Pydantic validation schemas
- [x] T010 [P] Create app/utils/__init__.py and app/utils/rate_limiter.py with per-user rate limiting implementation
- [x] T011 [P] Create app/dependencies/__init__.py and app/dependencies/auth.py with JWT validation and user context extraction
- [x] T012 [P] Create app/services/__init__.py and app/services/task_service.py with business logic for task operations
- [x] T013 Create tests/__init__.py, tests/unit/__init__.py, tests/integration/__init__.py, and tests/contract/__init__.py directories

## Phase 3: User Story 1 - AI Agent Interacts with Task Management System
**Goal**: Enable AI agents to perform all basic task operations (add, list, update, complete, delete) with state persistence

**Independent Test**: The AI agent can successfully perform all basic task operations (add, list, update, complete, delete) through the MCP tools, with all state changes persisting in the database and being accessible across different AI agent invocations.

- [x] T014 [US1] Create app/tools/__init__.py and app/tools/task_tools.py skeleton for MCP tool definitions
- [x] T015 [P] [US1] Create tests/unit/test_task_service.py with tests for task service operations
- [x] T016 [P] [US1] Create tests/contract/test_tool_contracts.py with contract tests for all tools
- [x] T017 [P] [US1] Create app/main.py and app/mcp_server.py with MCP server entry point using Official MCP SDK
- [x] T018 [P] [US1] Implement Task model in app/models/task.py with all required attributes and validation rules
- [x] T019 [P] [US1] Implement Pydantic schemas in app/schemas/task.py for task validation
- [x] T020 [US1] Implement TaskService in app/services/task_service.py with all CRUD operations
- [x] T021 [US1] Implement add_task MCP tool in app/tools/task_tools.py with input validation and persistence
- [x] T022 [US1] Implement list_tasks MCP tool in app/tools/task_tools.py with status filtering and user scoping
- [x] T023 [US1] Implement complete_task MCP tool in app/tools/task_tools.py with idempotent behavior
- [x] T024 [US1] Implement update_task MCP tool in app/tools/task_tools.py with field validation and updates
- [x] T025 [US1] Implement delete_task MCP tool in app/tools/task_tools.py with user scoping validation
- [x] T026 [US1] Register all MCP tools in app/main.py and initialize server
- [x] T027 [US1] Create tests/unit/test_task_tools.py with unit tests for each tool
- [x] T028 [US1] Run integration tests to verify all tools work together

## Phase 4: User Story 2 - Secure Multi-User Task Isolation
**Goal**: Ensure different users' tasks remain isolated and secure, preventing cross-user access

**Independent Test**: When an AI agent operates under User A's context, it cannot access, modify, or delete tasks belonging to User B, and vice versa.

- [x] T029 [US2] Enhance JWT validation in app/dependencies/auth.py to extract and validate user_id properly
- [x] T030 [US2] Update TaskService in app/services/task_service.py to enforce user_id scoping on all operations
- [x] T031 [US2] Add comprehensive authorization checks in all MCP tools for user isolation
- [x] T032 [US2] Create tests/integration/test_auth_scoping.py with tests for user isolation
- [x] T033 [US2] Test cross-user access prevention scenarios
- [x] T034 [US2] Verify that unauthorized access attempts return appropriate error responses

## Phase 5: User Story 3 - Reliable State Persistence
**Goal**: Ensure task data persists reliably in the database across server restarts and AI agent invocations

**Independent Test**: Tasks created through the MCP tools remain accessible after server restarts, and all operations result in persistent changes to the database.

- [x] T035 [US3] Implement proper database transaction handling in TaskService
- [x] T036 [US3] Add database connection resilience and retry logic
- [x] T037 [US3] Create tests/integration/test_persistence.py with tests for data persistence across restarts
- [x] T038 [US3] Test database operations with simulated server restarts
- [x] T039 [US3] Verify that all state changes are properly committed to database
- [x] T040 [US3] Test error handling when database operations fail

## Phase 6: Error Handling & Validation
**Goal**: Implement standardized error responses and comprehensive input validation

- [x] T041 Create standardized error response format across all tools
- [x] T042 [P] Implement error object structure as defined in data model
- [x] T043 [P] Add comprehensive input validation to all MCP tools per specification
- [x] T044 Add proper error handling for all edge cases identified in spec
- [x] T045 Ensure all error responses follow the format {"error": {"code": "...", "message": "...", "details": {...}}}
- [x] T046 Test error scenarios and validate response consistency

## Phase 7: Rate Limiting & Safety
**Goal**: Implement rate limiting and ensure safe, deterministic behavior

- [x] T047 Integrate rate limiter in app/utils/rate_limiter.py with MCP tools
- [x] T048 Configure rate limiting per user_id as specified (100 requests per minute)
- [x] T049 Ensure rate limiting doesn't affect tool determinism
- [x] T050 Test rate limiting behavior with various request patterns
- [x] T051 Validate that all tools maintain deterministic behavior

## Phase 8: Verification & Polish
**Goal**: Verify all acceptance criteria and ensure compliance with Phase 3 requirements

- [x] T052 Verify MCP tools are the only allowed mutation path
- [x] T053 Verify server remains stateless across requests (no in-memory caching)
- [x] T054 Test all acceptance scenarios from user stories
- [x] T055 Run complete test suite (unit, integration, contract)
- [x] T056 Verify compliance with all functional requirements (FR-001 through FR-020)
- [x] T057 Verify success criteria are met (SC-001 through SC-006)
- [x] T058 Update README.md with complete usage instructions
- [x] T059 Create quickstart documentation based on quickstart.md
- [x] T060 Final integration testing and validation

## Dependencies

User Story 2 (Secure Multi-User Task Isolation) depends on foundational authentication being implemented in Phase 2.
User Story 3 (Reliable State Persistence) depends on database integration from Phase 2.

## Parallel Execution Opportunities

- Schemas and models can be developed in parallel (T018, T019)
- Unit tests can be written in parallel with tool implementations (T015, T027)
- Multiple MCP tools can be implemented in parallel after foundational components are ready (T021-T025)

## Implementation Strategy

Start with Phase 1 and 2 to establish the foundational infrastructure. Then implement User Story 1 as the core functionality, followed by the security enhancements in User Story 2, and persistence verification in User Story 3. Complete with error handling, rate limiting, and final verification.