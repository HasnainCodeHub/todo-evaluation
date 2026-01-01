# Skill: python-backend-structure

## Purpose
Organize backend Python code cleanly for FastAPI projects. This skill establishes directory structure, module organization, and code separation patterns that enable maintainable, testable backend development within the monorepo context.

## When to Use
- When setting up initial backend directory structure
- When organizing code into logical modules
- When defining layer separation (routers, services, models)
- When establishing import patterns and dependency flow
- When creating new backend features or domains
- When reviewing code organization for consistency

## When NOT to Use
- When the technology stack isn't confirmed as Python/FastAPI
- When working on frontend structure (use frontend-architecture)
- When designing API contracts (use rest-api-design)
- When implementing specific business logic
- When the monorepo structure hasn't been defined

## Responsibilities
- Define backend directory hierarchy (app/, routers/, services/, models/)
- Establish module responsibility boundaries
- Create import organization patterns
- Plan configuration and settings management
- Design test directory structure parallel to source
- Document dependency flow between layers
- Ensure compatibility with FastAPI application factory
- Maintain clean separation of concerns

## Inputs
- Monorepo backend directory location
- FastAPI application requirements
- Database and authentication integrations
- Feature domains and boundaries
- Coding standards and conventions

## Outputs
- Backend directory structure diagram
- Module organization guidelines
- Import pattern documentation
- Configuration management strategy
- Test organization parallel to source
- Layer dependency rules

## Constraints
- Never import from higher layers to lower layers
- Never mix business logic with infrastructure code
- Never scatter configuration across multiple locations
- Never create circular imports between modules
- Always maintain clear layer boundaries
- Always organize tests to mirror source structure
- Always use __init__.py appropriately for packages

## Interaction With Other Skills
- **monorepo-architecture:** Operates within defined backend directory
- **fastapi-architecture:** Provides structure for FastAPI application
- **sqlmodel-design:** Houses database model definitions
- **jwt-verification:** Organizes authentication middleware
- **claude-context-design:** Informs backend CLAUDE.md context

## Anti-Patterns
- **Flat structure:** All files in single directory without organization
- **Circular imports:** Module A imports B which imports A
- **Layer violation:** Services importing from routers
- **God module:** Single module handling all concerns
- **Scattered config:** Settings files in multiple random locations
- **Test chaos:** Tests not mirroring source structure
- **Import pollution:** Wildcard imports or overly long import lists

## Phase Applicability
Phase II only. Phase I uses simple src/ structure for console application.
