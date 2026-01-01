# Evolution of Todo - Project Overview

## Project Purpose

Evolution of Todo is a hackathon project demonstrating Spec-Driven Development (SDD) across five progressive phases. The project evolves from a simple in-memory Python console application to a full-stack, cloud-native, AI-enhanced task management system.

## Current Phase

**Phase 2.0**: Repository & Governance Evolution (Governance-Only)

## Phase Roadmap

| Phase | Name | Description | Status |
|-------|------|-------------|--------|
| I | Console App | In-memory Python CLI task manager | ✅ Complete |
| 2.0 | Governance | Repository structure and spec organization | 🔄 In Progress |
| 2.1 | Database | PostgreSQL persistence with Neon | ⏳ Pending |
| 2.2 | Authentication | Better Auth with JWT | ⏳ Pending |
| 2.3 | API | FastAPI RESTful backend | ⏳ Pending |
| 2.4 | Frontend | Next.js App Router UI | ⏳ Pending |
| III | AI Chatbot | OpenAI Agents SDK with MCP | ⏳ Pending |
| IV | Local Cloud | Kubernetes with Minikube | ⏳ Pending |
| V | Cloud Deploy | AKS/GKE with Kafka and Dapr | ⏳ Pending |

## Spec-Driven Development

All development follows the SDD lifecycle:

```
Specify → Plan → Tasks → Implement
```

- **No code without spec**: Every feature must have a specification
- **No spec bypass**: Agents cannot invent requirements
- **Constitution authority**: `.specify/memory/constitution.md` defines governance

## Repository Structure

```
/
├── frontend/           # Next.js frontend (Phase 2.4+)
├── backend/            # FastAPI backend (Phase 2.3+)
├── src/                # Phase I console app (preserved)
├── specs/              # All specifications (this directory)
│   ├── overview.md     # This file
│   ├── architecture.md # System architecture
│   ├── features/       # Feature specifications
│   ├── api/            # API specifications
│   ├── database/       # Database specifications
│   └── ui/             # UI specifications
├── .specify/           # Spec-Kit Plus templates
├── .claude/            # Claude Code agents and skills
├── history/            # PHRs and ADRs
├── CLAUDE.md           # Root Claude context
└── AGENTS.md           # Agent behavioral authority
```

## Spec Referencing

All specifications are referenced using `@specs/` paths:

- `@specs/features/auth/spec.md` - Authentication feature spec
- `@specs/api/tasks/spec.md` - Tasks API spec
- `@specs/database/schema.md` - Database schema spec

## Governance

- **Constitution**: `.specify/memory/constitution.md`
- **Agent Authority**: `AGENTS.md`
- **Spec Authority**: This `/specs` directory

See `architecture.md` for system design details.
