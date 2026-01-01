# Skill: claude-context-design

## Purpose
Structure CLAUDE.md files (root, frontend, backend) so Claude Code loads correct context for each layer. This skill ensures that AI-assisted development operates with appropriate context boundaries, preventing cross-layer confusion and enabling focused, accurate assistance.

## When to Use
- When setting up initial CLAUDE.md files for a monorepo
- When defining layer-specific instructions for Claude Code
- When establishing context inheritance patterns (root → layer)
- When updating context files after architectural changes
- When debugging context-related issues in Claude Code behavior
- When onboarding new layers or components to the project

## When NOT to Use
- When the monorepo structure hasn't been defined yet
- When working on implementation details within a layer
- When writing specifications (use spec-writing)
- When designing the overall architecture (use monorepo-architecture)
- When context files are already correctly configured

## Responsibilities
- Define root CLAUDE.md with project-wide instructions
- Create frontend-specific CLAUDE.md with React/Next.js context
- Create backend-specific CLAUDE.md with Python/FastAPI context
- Establish context inheritance hierarchy
- Document layer-specific constraints and conventions
- Configure technology stack awareness per layer
- Set appropriate boundaries for each context
- Ensure context files don't conflict or contradict

## Inputs
- Monorepo directory structure
- Technology stack per layer
- Project constitution and governance
- Layer-specific coding standards
- Spec-Kit Plus conventions
- Team workflow preferences

## Outputs
- Root CLAUDE.md with project-wide context
- Frontend CLAUDE.md with UI/client context
- Backend CLAUDE.md with API/server context
- Context inheritance documentation
- Layer boundary definitions for AI assistance

## Constraints
- Never include implementation code in context files
- Never create contradictory instructions across layers
- Never expose secrets or sensitive configuration patterns
- Never make context files excessively long (focus on essentials)
- Always maintain clear layer boundaries in instructions
- Always ensure root context applies universally
- Always keep context files in sync with actual architecture

## Interaction With Other Skills
- **monorepo-architecture:** Consumes structure to place context files correctly
- **frontend-architecture:** Provides frontend-specific context requirements
- **python-backend-structure:** Provides backend-specific context requirements
- **constraint-enforcement:** Ensures context files enforce project constraints
- **spec-referencing:** Coordinates spec path conventions in context

## Anti-Patterns
- **Context bloat:** Overloading context files with unnecessary information
- **Layer leakage:** Including backend details in frontend context or vice versa
- **Stale context:** Context files that don't reflect current architecture
- **Contradictory instructions:** Root and layer contexts that conflict
- **Missing inheritance:** Layer contexts that don't build on root context
- **Over-restriction:** Context so restrictive it prevents useful assistance
- **Under-specification:** Context so vague it provides no useful guidance

## Phase Applicability
Phase II only. Phase I uses single CLAUDE.md at repository root.
