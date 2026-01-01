# Skill: relational-data-modeling

## Purpose
Model relationships between users and tasks with proper constraints and ownership. This skill establishes patterns for designing relational data models that correctly represent entity relationships, enforce data integrity, and support multi-tenant data isolation.

## When to Use
- When designing entity relationships (one-to-many, many-to-many)
- When establishing ownership constraints (user owns tasks)
- When defining foreign key relationships
- When planning data integrity constraints
- When ensuring multi-user data isolation
- When creating data model specifications

## When NOT to Use
- When working with non-relational data stores
- When relationships haven't been defined in specifications
- When implementing ORM code (use sqlmodel-design)
- When designing API contracts
- When data model requirements are unclear

## Responsibilities
- Define entity relationship cardinality
- Establish ownership relationships (User → Tasks)
- Design foreign key constraints
- Plan cascade behaviors (delete, update)
- Document data integrity rules
- Ensure user-scoped data isolation
- Create entity-relationship diagrams
- Define unique constraints and indexes

## Inputs
- Feature specifications with entity definitions
- User and authentication model requirements
- Data isolation requirements
- Performance requirements
- Existing data model (if extending)

## Outputs
- Entity-relationship diagram
- Relationship cardinality documentation
- Foreign key constraint definitions
- Cascade behavior specifications
- Data integrity rule documentation
- Index recommendations

## Constraints
- Never allow orphaned records (tasks without users)
- Never expose other users' data through relationships
- Never create circular ownership relationships
- Never ignore cascade delete implications
- Always enforce referential integrity
- Always scope data access by user ownership
- Always document relationship semantics clearly

## Interaction With Other Skills
- **sqlmodel-design:** Implements relationships in SQLModel classes
- **neon-postgres-integration:** Ensures relationships work with Neon
- **rest-api-design:** Aligns resources with relationship structure
- **auth-boundary-design:** Coordinates ownership with authorization
- **spec-writing:** Incorporates relationships into specifications

## Anti-Patterns
- **Orphan allowance:** Permitting tasks to exist without owning user
- **Ownership ambiguity:** Unclear who owns which data
- **Cascade chaos:** Unintended deletions through cascade rules
- **Cross-tenant leakage:** Relationships that expose other users' data
- **Circular ownership:** A owns B owns C owns A scenarios
- **Implicit relationships:** Relationships not enforced at database level
- **Over-normalization:** Excessive tables for simple relationships

## Phase Applicability
Phase II only. Phase I has no user relationships or data persistence.
