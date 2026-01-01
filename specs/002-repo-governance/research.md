# Research: Repository & Governance Evolution (Phase 2.0)

**Feature**: 002-repo-governance
**Date**: 2026-01-01
**Purpose**: Resolve technical decisions for monorepo structure, spec governance, and Claude Code context layering

---

## Research Questions

### RQ-001: Monorepo Directory Structure
**Question**: What is the optimal directory layout for a full-stack monorepo with frontend (Next.js) and backend (FastAPI)?

**Decision**: Use layer-based root directories with clear separation

**Structure**:
```
/
├── frontend/           # Next.js application
│   ├── CLAUDE.md       # Frontend-specific context
│   └── ...             # (empty until Phase 2.1+)
├── backend/            # FastAPI application
│   ├── CLAUDE.md       # Backend-specific context
│   └── ...             # (empty until Phase 2.1+)
├── src/                # Phase I code (preserved)
├── specs/              # All specifications
├── .spec-kit/          # Spec-Kit Plus configuration
├── CLAUDE.md           # Root context
└── AGENTS.md           # Behavioral authority
```

**Rationale**:
- Clear layer separation prevents cross-concern pollution
- Each layer can have independent tooling and dependencies
- Claude Code can load layer-specific context based on working directory
- Phase I code preserved intact in /src

**Alternatives Considered**:
- packages/ monorepo style (rejected: adds unnecessary complexity for 2 layers)
- apps/ directory (rejected: "apps" implies deployable units, frontend/backend is clearer)

---

### RQ-002: Spec Directory Organization
**Question**: How should specifications be organized to support @specs/ path referencing?

**Decision**: Organize by concern type with hierarchical subdirectories

**Structure**:
```
/specs/
├── overview.md         # Project overview
├── architecture.md     # System architecture
├── features/           # Feature specifications
│   └── [feature-name]/
│       └── spec.md
├── api/                # API specifications
│   └── [endpoint-group]/
│       └── spec.md
├── database/           # Database specifications
│   └── schema.md
│   └── migrations/
└── ui/                 # UI specifications
    └── [component-group]/
        └── spec.md
```

**Rationale**:
- Concern-based organization matches development workflow
- @specs/api/tasks/spec.md is intuitive and findable
- Subdirectories allow feature growth without restructuring
- Mirrors how teams think about system components

**Alternatives Considered**:
- Flat structure (rejected: doesn't scale, hard to navigate)
- Phase-based organization (rejected: specs span phases, creates duplication)

---

### RQ-003: Claude Code Context Layering Strategy
**Question**: How should CLAUDE.md files be structured to provide correct context at each layer?

**Decision**: Three-tier context hierarchy with inheritance

**Hierarchy**:
1. **Root CLAUDE.md** (always loaded first)
   - Project overview and purpose
   - Spec-Kit Plus usage instructions
   - Reference to AGENTS.md as behavioral authority
   - @specs/ path convention documentation

2. **Layer CLAUDE.md** (loaded when in that directory)
   - Technology stack specific to that layer
   - Coding conventions for that layer
   - Restrictions preventing cross-layer concerns
   - Reference back to root for shared context

**Content Guidelines**:

Root CLAUDE.md MUST include:
- Project name and phase
- Spec-Kit Plus structure explanation
- "See AGENTS.md for behavioral rules"
- @specs/ path referencing guide

Frontend CLAUDE.md MUST include:
- "This is a Next.js frontend using App Router"
- "DO NOT implement backend logic, APIs, or database access"
- Frontend coding conventions
- Component and page organization

Backend CLAUDE.md MUST include:
- "This is a Python FastAPI backend"
- "DO NOT implement frontend UI, React components, or styling"
- Backend coding conventions
- API and service organization

**Rationale**:
- Layered context prevents AI confusion about current scope
- Explicit restrictions reduce cross-layer mistakes
- Root context ensures consistent project understanding
- AGENTS.md remains single behavioral authority

---

### RQ-004: Spec-Kit Configuration
**Question**: What configuration is needed for /.spec-kit/config.yaml?

**Decision**: Minimal configuration pointing to spec and history directories

**Configuration**:
```yaml
version: "1.0"
specs_directory: "specs"
history_directory: "history"
templates_directory: ".specify/templates"
agent_context: "AGENTS.md"
```

**Rationale**:
- Points Spec-Kit Plus to correct directories
- Enables @specs/ path resolution
- Maintains compatibility with existing .specify structure
- Simple and maintainable

---

### RQ-005: Phase I Preservation Strategy
**Question**: How do we ensure Phase I code in /src remains unmodified?

**Decision**: Document preservation requirement; verify via git diff

**Verification Method**:
1. Before Phase 2.0 implementation, record hash of /src contents
2. After Phase 2.0, verify no changes to /src via:
   ```bash
   git diff HEAD~1 -- src/
   ```
3. Any changes to /src MUST be rejected

**Rationale**:
- Git provides reliable change detection
- No modification is simpler than selective modification
- Phase I functionality remains testable independently

---

## Constitution Compliance Check

| Gate | Requirement | Status |
|------|-------------|--------|
| Spec-Driven | Plan follows spec | ✅ PASS |
| Phase Discipline | Phase 2.0 scope only | ✅ PASS |
| No Application Code | No features implemented | ✅ PASS |
| Technology Stack | No stack violations | ✅ PASS (governance only) |
| Documentation | Specs, plans, tasks required | ✅ PASS |

**Notes**:
- Phase 2.0 is explicitly a governance phase with no application code
- Technology references in CLAUDE.md files describe context, not implementation
- All requirements map to repository structure and documentation

---

## Summary

Phase 2.0 research confirms:
1. **Monorepo structure**: /frontend, /backend, /src (preserved), /specs
2. **Spec organization**: Concern-based hierarchy under /specs
3. **Context layering**: Three-tier CLAUDE.md with explicit layer restrictions
4. **Configuration**: Minimal .spec-kit/config.yaml
5. **Preservation**: Git-based verification for /src integrity

No clarifications needed - all decisions are straightforward governance choices.
