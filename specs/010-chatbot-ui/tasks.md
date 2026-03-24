# Tasks: Chatbot UI

**Feature**: `010-chatbot-ui`
**Source**: `specs/010-chatbot-ui/spec.md`
**Plan**: `specs/010-chatbot-ui/plan.md`
**Date**: 2026-03-25

## Phase A - Documentation Alignment

- [x] T001 Update spec with delete-confirmation user story and FR-015.
- [x] T002 Update implementation plan with delete-confirmation gate details.

## Phase B - Frontend Implementation

- [x] T003 Add delete-intent confirmation modal flow in `frontend/components/chat/ChatPanel.tsx`.
- [x] T004 Reuse existing `ConfirmDialog` component for consistency with current dashboard UX.
- [x] T005 Ensure "Yes" sends the exact pending delete message; "No" cancels without sending.

## Phase C - Verification

- [x] T006 Run frontend build (`npm run build`) and confirm no type/lint regressions.
- [ ] T007 Manual behavior check:
  - Delete-intent chat message shows confirmation popup.
  - Cancel keeps user on page and sends nothing.
  - Confirm sends message and chat flow continues.

## Phase D - Task ID Visibility For Chat

- [x] T008 Update spec/plan for visible task IDs in dashboard cards (FR-016).
- [x] T009 Show visible task ID badge in `frontend/components/tasks/TaskItem.tsx`.
- [x] T010 Add brief guidance text indicating IDs can be used in AI chat commands.
- [x] T011 Run frontend build and confirm task-ID UI changes compile successfully.

## Phase E - Completion Feedback In Task Cards

- [x] T012 Update spec/plan for completion loading and success feedback (FR-017).
- [x] T013 Add task-specific loading and success UI when marking a task completed.
- [x] T014 Update task toggle callback types to support awaited completion flow in the UI.
- [x] T015 Run frontend build and confirm completion-feedback UI compiles successfully.

## Phase F - Professional Feedback Across Task Actions

- [x] T016 Update spec/plan for unified professional task-action feedback (FR-018).
- [x] T017 Mount toast provider at app layout level for action confirmations.
- [x] T018 Extend task card feedback to reopen, update, and delete flows with professional messaging.
- [x] T019 Refine task creation feedback copy to match the professional action-feedback pattern.
- [x] T020 Run frontend build and confirm the unified feedback flow compiles successfully.

## Phase G - Professional Task Metadata Row

- [x] T021 Update spec/plan for professional metadata row in task cards (FR-019).
- [x] T022 Add created, updated, and last-modified metadata display to `frontend/components/tasks/TaskItem.tsx`.
- [x] T023 Run frontend build and confirm metadata-row changes compile successfully.

## Phase H - Structured Task Creation Metadata

- [x] T024 Update spec/plan for structured task metadata fields (FR-020 to FR-022).
- [x] T025 Add backend task model, schema, CRUD, and router support for `priority`, `due_date`, and `category`.
- [x] T026 Add a safe startup schema patch so existing task tables receive missing metadata columns.
- [x] T027 Extend frontend task types plus create/edit forms to send structured metadata.
- [x] T028 Display priority, due date, and category in task cards with professional styling.
- [x] T029 Run targeted verification for backend/frontend contract alignment and dashboard behavior.


