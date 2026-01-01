# Tasks: Repository & Governance Evolution (Phase 2.0)

**Input**: Design documents from `/specs/002-repo-governance/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete)

**Tests**: Not applicable - governance phase with manual verification only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Governance phase**: Root-level directories and markdown files only
- No source code directories in this phase

---

## Phase 1: Setup (Validation & Scope Confirmation)

**Purpose**: Validate Phase 2.0 scope and confirm constraints before execution

- [ ] T001 Validate Phase 2.0 scope confirming only governance artifacts are in-scope
- [ ] T002 [P] Record hash/checksum of src/ directory for Phase I preservation verification
- [ ] T003 [P] Verify AGENTS.md exists as behavioral authority

**Checkpoint**: Scope validated, Phase I baseline recorded

**Agents**: phase-orchestrator, requirements-ingestor
**Skills**: spec-interpretation, constraint-enforcement

---

## Phase 2: User Story 1 - Monorepo Structure Creation (Priority: P1) 🎯

**Goal**: Create monorepo directory structure with frontend, backend, and specs directories

**Independent Test**: Verify /frontend, /backend, and /specs directories exist with required files

### Implementation for User Story 1

- [ ] T004 [US1] Create /frontend directory at repository root
- [ ] T005 [P] [US1] Create /backend directory at repository root
- [ ] T006 [P] [US1] Create /.spec-kit directory at repository root
- [ ] T007 [US1] Create /.spec-kit/config.yaml with Spec-Kit Plus configuration

**Checkpoint**: Monorepo layer directories exist

**Agents**: monorepo-architect
**Skills**: monorepo-architecture

---

## Phase 3: User Story 2 - Spec Organization & Governance (Priority: P1)

**Goal**: Create /specs directory structure organized by concern

**Independent Test**: Verify /specs contains overview.md, architecture.md, and all subdirectories

### Implementation for User Story 2

- [ ] T008 [US2] Create /specs directory at repository root (if not exists from 001-cli-task-crud)
- [ ] T009 [US2] Create /specs/overview.md with project overview content
- [ ] T010 [P] [US2] Create /specs/architecture.md with system architecture content
- [ ] T011 [P] [US2] Create /specs/features/ subdirectory for feature specifications
- [ ] T012 [P] [US2] Create /specs/api/ subdirectory for API specifications
- [ ] T013 [P] [US2] Create /specs/database/ subdirectory for database specifications
- [ ] T014 [P] [US2] Create /specs/ui/ subdirectory for UI specifications
- [ ] T015 [US2] Add .gitkeep to empty subdirectories to ensure they persist in git

**Checkpoint**: Spec governance structure complete with all directories and root documents

**Agents**: monorepo-architect
**Skills**: monorepo-architecture, spec-referencing

---

## Phase 4: User Story 3 - Claude Code Context Layering (Priority: P2)

**Goal**: Create layered CLAUDE.md files for root, frontend, and backend contexts

**Independent Test**: Verify all three CLAUDE.md files exist with required content and restrictions

### Implementation for User Story 3

- [ ] T016 [US3] Update root CLAUDE.md with project overview and Spec-Kit Plus structure
- [ ] T017 [US3] Add AGENTS.md reference as behavioral authority in root CLAUDE.md
- [ ] T018 [US3] Document @specs/ path convention in root CLAUDE.md
- [ ] T019 [P] [US3] Create /frontend/CLAUDE.md with Next.js context and backend restrictions
- [ ] T020 [P] [US3] Create /backend/CLAUDE.md with FastAPI context and frontend restrictions

**Checkpoint**: Claude Code context layering complete with cross-layer restrictions

**Agents**: monorepo-architect
**Skills**: claude-context-design, constraint-enforcement

---

## Phase 5: User Story 4 - Spec-Kit Configuration (Priority: P3)

**Goal**: Ensure Spec-Kit Plus configuration is valid and functional

**Independent Test**: Verify /.spec-kit/config.yaml is valid YAML with correct paths

### Implementation for User Story 4

- [ ] T021 [US4] Validate /.spec-kit/config.yaml syntax and content
- [ ] T022 [US4] Verify specs_directory path resolves correctly
- [ ] T023 [US4] Verify history_directory path resolves correctly

**Checkpoint**: Spec-Kit configuration validated

**Skills**: spec-referencing

---

## Phase 6: Validation & Gate Check

**Purpose**: Final validation that Phase 2.0 is complete and safe to proceed

- [ ] T024 Verify /frontend directory exists with CLAUDE.md
- [ ] T025 [P] Verify /backend directory exists with CLAUDE.md
- [ ] T026 [P] Verify /specs directory has all required subdirectories
- [ ] T027 [P] Verify root CLAUDE.md references AGENTS.md
- [ ] T028 Verify Phase I code in /src unchanged via git diff
- [ ] T029 Run quickstart.md validation checklist
- [ ] T030 Confirm Phase 2.0 complete and authorize Phase 2.1

**Checkpoint**: Phase 2.0 COMPLETE - Phase 2.1 authorized

**Agents**: phase-orchestrator
**Skills**: constraint-enforcement

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (US1: Structure) → Phase 3 (US2: Specs)
                                          ↘
                                            Phase 4 (US3: Context) → Phase 6 (Validation)
                                          ↗
                              Phase 5 (US4: Config) ─┘
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Structure) | Phase 1 | Setup complete |
| US2 (Specs) | US1 directories | T004-T007 complete |
| US3 (Context) | US1 directories | T004-T007 complete |
| US4 (Config) | T007 | config.yaml created |

**Note**: US2 and US3 can run in parallel after US1 creates directory structure.

### Within Each User Story

1. Create directories before creating files within them
2. Core files before supplementary files
3. Configuration before validation

### Parallel Opportunities

**Phase 2**: T004, T005, T006 can run in parallel (different directories)
**Phase 3**: T010, T011, T012, T013, T014 can run in parallel (different paths)
**Phase 4**: T019, T020 can run in parallel (different directories)
**Phase 6**: T024, T025, T026, T027 can run in parallel (independent checks)

---

## Parallel Example: Phase 3 Spec Subdirectories

```bash
# Launch all subdirectory creation tasks together:
Task: "Create /specs/features/ subdirectory"
Task: "Create /specs/api/ subdirectory"
Task: "Create /specs/database/ subdirectory"
Task: "Create /specs/ui/ subdirectory"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup validation
2. Complete Phase 2: US1 - Create directory structure
3. Complete Phase 3: US2 - Create spec governance
4. **STOP and VALIDATE**: Core structure in place
5. Proceed to context layering

### Full Implementation

1. Setup → Validate scope and record Phase I baseline
2. US1 (Structure) → Directory structure created
3. US2 (Specs) + US3 (Context) → Parallel execution
4. US4 (Config) → Validate Spec-Kit configuration
5. Validation → Final checks → **Phase 2.0 Complete**

---

## Task Summary

| Phase | Task Count | User Story |
|-------|------------|------------|
| Setup | 3 | - |
| US1 (Structure) | 4 | P1 |
| US2 (Specs) | 8 | P1 |
| US3 (Context) | 5 | P2 |
| US4 (Config) | 3 | P3 |
| Validation | 7 | - |
| **TOTAL** | **30** | 4 stories |

---

## Responsible Intelligence

| Phase | Agents | Skills |
|-------|--------|--------|
| Setup | phase-orchestrator, requirements-ingestor | spec-interpretation, constraint-enforcement |
| US1-US2 | monorepo-architect | monorepo-architecture, spec-referencing |
| US3 | monorepo-architect | claude-context-design, constraint-enforcement |
| US4 | - | spec-referencing |
| Validation | phase-orchestrator | constraint-enforcement |

---

## Notes

- [P] tasks = different files/directories, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and verifiable
- Commit after each phase completion
- No application code in any task - governance only
- Tasks MUST be executed in order per constitution requirements
- Phase I code in /src must remain UNTOUCHED

---

## Authorization

Successful completion of all Phase 2.0 tasks authorizes:
- **Phase 2.1**: Database Persistence Layer
