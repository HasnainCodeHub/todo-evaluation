# AGENTS.md — Evolution of Todo

**Behavioral Authority for All Agents**

This file defines the behavioral rules, responsibilities, and constraints for all AI agents operating on this project. All agents MUST read and comply with this file before taking action.

---

## 1. Core Principles

### 1.1 Constitution Supremacy

The project constitution (`.specify/memory/constitution.md`) is the highest authority. When this file conflicts with the constitution, the constitution wins.

### 1.2 Spec-Driven Execution

All agents MUST follow the Spec-Driven Development lifecycle:

```
Specify → Plan → Tasks → Implement
```

**No task = no code.** Agents may not write, generate, or modify code without:
1. An approved specification
2. An approved plan
3. Defined tasks mapping to the work

### 1.3 Phase Discipline

Agents MUST respect phase boundaries:
- Only use technologies approved for the current phase
- Do not introduce future-phase features
- Do not skip phases

---

## 2. Agent Hierarchy

### 2.1 Orchestrator Agents

**phase-orchestrator**: High-level coordination and phase management
- Enforces workflow sequencing
- Prevents phase skipping
- Coordinates sub-agents
- Never implements features directly

### 2.2 Architect Agents

**monorepo-architect**: Repository structure and organization
- Directory layout decisions
- CLAUDE.md layering
- Spec file placement

**backend-api-architect**: FastAPI backend architecture
- REST API structure
- Middleware placement
- Authentication patterns

**frontend-app-architect**: Next.js frontend architecture
- Page layouts and routing
- Component organization
- API client patterns

**database-modeling-agent**: Database schema design
- Entity relationships
- Index optimization
- Migration planning

**auth-integration-agent**: Authentication architecture
- JWT strategies
- Better Auth integration
- User isolation policies

### 2.3 Implementer Agents

**claude-code-implementer**: Code generation from approved tasks
- Translates tasks to code
- Follows architectural decisions
- Respects phase constraints

---

## 3. Agent Behavioral Rules

### 3.1 Before Acting

Every agent MUST:
1. Read this file (AGENTS.md)
2. Check the constitution for constraints
3. Verify current phase
4. Read relevant specs before proceeding

### 3.2 During Execution

Agents MUST:
- Stay within task scope
- Reference task IDs in commits/changes
- Stop if underspecified (ask for clarification)
- Document decisions in appropriate artifacts

Agents MUST NOT:
- Invent requirements
- Add unspecified features
- Bypass the spec workflow
- Make assumptions about unclear requirements

### 3.3 Sub-Agent Invocation

When invoking sub-agents:
- The caller retains responsibility
- Pass relevant context explicitly
- Verify sub-agent output before proceeding
- Document the delegation in PHRs

---

## 4. Spec-Kit Plus Integration

### 4.1 Required Commands

Agents should use Spec-Kit Plus skills:

| Skill | Purpose |
|-------|---------|
| `/sp.specify` | Create or update specifications |
| `/sp.plan` | Generate implementation plans |
| `/sp.tasks` | Generate task breakdowns |
| `/sp.implement` | Execute approved tasks |
| `/sp.clarify` | Resolve underspecified areas |
| `/sp.analyze` | Cross-artifact consistency check |
| `/sp.phr` | Record prompt history |
| `/sp.adr` | Document architectural decisions |

### 4.2 Artifact Hierarchy

When conflicts arise:

```
Constitution > Spec > Plan > Tasks > Implementation
```

---

## 5. Context Layering

### 5.1 File Hierarchy

```
/CLAUDE.md           — Project-wide rules (this level)
/AGENTS.md           — Agent behavioral rules (this file)
/frontend/CLAUDE.md  — Frontend-specific context
/backend/CLAUDE.md   — Backend-specific context
```

### 5.2 Inheritance

- Layer-specific files inherit from root CLAUDE.md
- More specific contexts override general contexts
- All layers must comply with AGENTS.md

---

## 6. Phase-Specific Rules

### 6.1 Phase 2.0 (Current)

**Scope**: Repository & Governance Evolution

**Allowed**:
- Directory structure creation
- Configuration files
- Markdown documentation
- CLAUDE.md files

**Forbidden**:
- Application code
- Database connections
- API implementations
- UI code

### 6.2 Phase 2.3 (Backend)

**Scope**: FastAPI Backend Implementation

**Allowed**:
- Python code in `/backend`
- SQLModel models
- API routes
- JWT verification

**Forbidden**:
- Frontend code
- Direct database schema changes without migration

### 6.3 Phase 2.4 (Frontend)

**Scope**: Next.js Frontend Implementation

**Allowed**:
- TypeScript/React code in `/frontend`
- Next.js pages and components
- Better Auth integration

**Forbidden**:
- Backend code modifications
- Direct database access

---

## 7. Error Recovery

### 7.1 When Blocked

1. Document the blocker clearly
2. Identify root cause (spec gap, dependency, ambiguity)
3. Do NOT proceed with assumptions
4. Request human clarification

### 7.2 When Deviated

1. Stop immediately
2. Document the deviation
3. Assess impact
4. Revert if necessary
5. Update specs if deviation is intentional

---

## 8. Compliance Verification

Before completing any task, agents MUST verify:

- [ ] Task maps to approved spec
- [ ] Implementation matches plan
- [ ] Phase constraints respected
- [ ] No forbidden technologies used
- [ ] PHR created for the work

---

**Version**: 1.0.0 | **Effective**: Phase 2.0+
