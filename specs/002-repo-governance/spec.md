# Feature Specification: Repository & Governance Evolution (Phase 2.0)

**Feature Branch**: `002-repo-governance`
**Created**: 2026-01-01
**Status**: Draft
**Input**: Phase 2.0 specification for evolving Phase I repository into a full-stack-ready monorepo with Spec-Kit Plus governance and Claude Code context layering

## Overview

Phase 2.0 prepares the project for full-stack development by evolving the repository structure, governance artifacts, and Claude Code context. This phase introduces no application features and produces no functional code. Its sole purpose is to establish a clean, scalable foundation for Phase II implementation.

## Scope

### In Scope
- Repository structure evolution to monorepo layout
- Spec organization and governance under /specs
- Claude Code context layering (root, frontend, backend)
- Documentation scaffolding for future phases
- Reusable intelligence alignment

### Out of Scope
- Backend API implementation
- Database implementation
- Authentication implementation
- Frontend UI implementation
- Any application logic or features

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monorepo Structure Creation (Priority: P1)

As a developer, I need a clear monorepo structure that separates frontend and backend concerns so that I can work on either layer without interference and Claude Code loads appropriate context.

**Why this priority**: The repository structure is the foundation for all subsequent development. Without proper structure, specs and context files cannot be organized correctly.

**Independent Test**: Can be verified by checking that /frontend, /backend, and /specs directories exist with their required files, and that Phase I code remains untouched in /src.

**Acceptance Scenarios**:

1. **Given** the Phase I repository, **When** Phase 2.0 is complete, **Then** /frontend directory exists with CLAUDE.md file
2. **Given** the Phase I repository, **When** Phase 2.0 is complete, **Then** /backend directory exists with CLAUDE.md file
3. **Given** the Phase I repository, **When** Phase 2.0 is complete, **Then** /specs directory exists with subdirectories (features/, api/, database/, ui/)
4. **Given** Phase I source code in /src, **When** Phase 2.0 is complete, **Then** all Phase I files remain unmodified

---

### User Story 2 - Spec Organization & Governance (Priority: P1)

As a developer, I need specifications organized by concern (features, api, database, ui) so that I can find relevant specs quickly and ensure all implementation is spec-driven.

**Why this priority**: Equal to structure because specs define WHAT to build. Without organized specs, implementation cannot proceed correctly.

**Independent Test**: Can be verified by confirming /specs directory contains overview.md, architecture.md, and organized subdirectories that are referenceable via @specs/ paths.

**Acceptance Scenarios**:

1. **Given** the /specs directory, **When** viewing its contents, **Then** overview.md and architecture.md exist at root level
2. **Given** the /specs directory, **When** viewing its contents, **Then** features/, api/, database/, and ui/ subdirectories exist
3. **Given** any spec file, **When** referencing it from code or documentation, **Then** @specs/ path convention resolves correctly

---

### User Story 3 - Claude Code Context Layering (Priority: P2)

As a developer using Claude Code, I need layered CLAUDE.md files so that Claude loads correct context based on which directory I'm working in, preventing cross-layer confusion.

**Why this priority**: Context layering improves AI assistance quality but depends on structure being in place first.

**Independent Test**: Can be verified by checking that root CLAUDE.md references AGENTS.md, frontend CLAUDE.md defines frontend constraints, and backend CLAUDE.md defines backend constraints.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** Claude Code loads context, **Then** root CLAUDE.md describes overall project and references AGENTS.md
2. **Given** the /frontend directory, **When** Claude Code loads context, **Then** frontend CLAUDE.md restricts agents from backend concerns
3. **Given** the /backend directory, **When** Claude Code loads context, **Then** backend CLAUDE.md restricts agents from frontend concerns

---

### User Story 4 - Spec-Kit Configuration (Priority: P3)

As a developer, I need Spec-Kit Plus configured correctly so that spec management workflows operate as expected.

**Why this priority**: Configuration enables tooling but is less critical than structure and content.

**Independent Test**: Can be verified by confirming /.spec-kit/config.yaml exists with valid configuration.

**Acceptance Scenarios**:

1. **Given** the repository, **When** Spec-Kit Plus commands are run, **Then** /.spec-kit/config.yaml provides correct paths and settings

---

### Edge Cases

- What happens when Phase I source files are accidentally modified? Verification must detect and report this.
- What happens when CLAUDE.md files reference non-existent paths? Validation must catch broken references.
- How does system handle missing subdirectories under /specs? All required subdirectories must be created.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Repository MUST contain /frontend directory with CLAUDE.md file
- **FR-002**: Repository MUST contain /backend directory with CLAUDE.md file
- **FR-003**: Repository MUST contain /specs directory at root level
- **FR-004**: /specs MUST contain overview.md documenting project overview
- **FR-005**: /specs MUST contain architecture.md documenting system architecture
- **FR-006**: /specs MUST contain features/ subdirectory for feature specifications
- **FR-007**: /specs MUST contain api/ subdirectory for API specifications
- **FR-008**: /specs MUST contain database/ subdirectory for database specifications
- **FR-009**: /specs MUST contain ui/ subdirectory for UI specifications
- **FR-010**: Root CLAUDE.md MUST describe overall project and reference AGENTS.md
- **FR-011**: Root CLAUDE.md MUST explain Spec-Kit structure and @specs/ path usage
- **FR-012**: /frontend/CLAUDE.md MUST define frontend stack (Next.js) and conventions
- **FR-013**: /frontend/CLAUDE.md MUST restrict frontend agents from backend concerns
- **FR-014**: /backend/CLAUDE.md MUST define backend stack (FastAPI, Python) and conventions
- **FR-015**: /backend/CLAUDE.md MUST restrict backend agents from frontend concerns
- **FR-016**: Repository MUST contain /.spec-kit/config.yaml with valid configuration
- **FR-017**: Phase I source code in /src MUST remain unmodified
- **FR-018**: AGENTS.md MUST remain the behavioral authority for all agents
- **FR-019**: All specifications MUST be referenceable via @specs/ path convention

### Key Entities

- **Spec Document**: A markdown file defining WHAT to build for a specific concern (feature, api, database, ui)
- **CLAUDE.md Context**: A markdown file providing context and constraints for Claude Code at a specific directory level
- **Spec-Kit Config**: A YAML configuration file defining Spec-Kit Plus behavior and paths

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 4 required directories exist (/frontend, /backend, /specs, /.spec-kit)
- **SC-002**: All 3 CLAUDE.md files exist (root, frontend, backend) with required content
- **SC-003**: All 4 spec subdirectories exist (features/, api/, database/, ui/)
- **SC-004**: 100% of Phase I source files verified unchanged (hash comparison or diff)
- **SC-005**: Spec-Kit configuration is valid and parseable
- **SC-006**: All spec paths resolvable via @specs/ convention

## Assumptions

- Phase I source code location: /src directory (to remain untouched)
- Frontend technology stack: Next.js with App Router (for CLAUDE.md context)
- Backend technology stack: FastAPI with Python (for CLAUDE.md context)
- AGENTS.md already exists and defines agent behaviors
- Spec-Kit Plus tooling is available and functional

## Dependencies

- Phase I completion (all 42 tasks complete)
- Existing AGENTS.md behavioral authority document

## Next Phase

Completion of Phase 2.0 authorizes:
- **Phase 2.1**: Database Persistence Layer
