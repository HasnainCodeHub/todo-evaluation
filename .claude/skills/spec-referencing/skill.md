# Skill: spec-referencing

## Purpose
Ensure correct referencing and usage of specs using @specs paths across frontend and backend layers. This skill establishes conventions for how specifications are referenced, linked, and navigated within a monorepo structure to maintain traceability and consistency.

## When to Use
- When creating new specification documents that reference other specs
- When linking implementation code to its governing specification
- When establishing cross-layer specification dependencies
- When documenting API contracts that bridge frontend and backend
- When ensuring implementation tasks trace back to requirements
- When reviewing specifications for correct path references

## When NOT to Use
- When specifications have not been created yet
- When working on implementation without spec context
- When designing monorepo structure (use monorepo-architecture)
- When validating spec content quality (use spec-validation)
- When interpreting spec requirements (use spec-interpretation)

## Responsibilities
- Define @specs path conventions for the monorepo
- Establish spec-to-spec reference patterns
- Create code-to-spec linking conventions
- Document cross-layer specification dependencies
- Ensure task files correctly reference parent specs
- Maintain spec reference consistency across all artifacts
- Enable IDE and tooling support for spec navigation
- Support Spec-Kit Plus artifact discovery

## Inputs
- Monorepo directory structure
- Existing specification documents
- Spec-Kit Plus conventions
- Feature and layer boundaries
- Implementation task references

## Outputs
- @specs path convention documentation
- Spec reference validation rules
- Cross-reference patterns for multi-layer specs
- Code comment spec reference format
- Task-to-spec traceability matrix patterns

## Constraints
- Never use relative paths that break across directories
- Never create orphaned specs without proper references
- Never reference specs that don't exist
- Never mix spec reference conventions within the project
- Always use consistent @specs notation
- Always maintain bidirectional traceability
- Always ensure references resolve correctly from any layer

## Interaction With Other Skills
- **monorepo-architecture:** Consumes directory structure for path conventions
- **spec-writing:** Provides reference patterns for new specifications
- **task-decomposition:** Ensures tasks correctly reference parent specs
- **claude-context-design:** Coordinates with context files for spec discovery
- **spec-validation:** Supports validation of spec reference integrity

## Anti-Patterns
- **Broken links:** References to specs that don't exist or have moved
- **Implicit references:** Assuming spec context without explicit paths
- **Relative confusion:** Using relative paths that break from different directories
- **Convention mixing:** Using different reference styles in the same project
- **Orphaned specs:** Specifications without inbound or outbound references
- **Circular references:** Spec A references B which references A without resolution
- **Layer bleeding:** Frontend specs directly referencing backend implementation details

## Phase Applicability
Phase II only. Phase I uses single-layer spec structure without cross-layer references.
