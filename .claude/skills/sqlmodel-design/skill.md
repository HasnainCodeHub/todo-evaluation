# Skill: sqlmodel-design

## Purpose
Design SQLModel schemas aligned with PostgreSQL and FastAPI. This skill establishes patterns for defining database models that leverage SQLModel's dual nature as both SQLAlchemy ORM models and Pydantic validation schemas.

## When to Use
- When designing database table schemas
- When defining model relationships and foreign keys
- When creating request/response models for API endpoints
- When establishing field validation rules
- When planning model inheritance and mixins
- When coordinating between database and API layers

## When NOT to Use
- When the database technology isn't PostgreSQL
- When not using SQLModel (pure SQLAlchemy or other ORM)
- When designing API contracts without database backing
- When working on frontend data models
- When the data model hasn't been specified

## Responsibilities
- Define SQLModel classes with appropriate fields
- Establish table=True for database-backed models
- Create Pydantic-only models for request/response validation
- Design foreign key relationships
- Configure field constraints and defaults
- Plan model inheritance for shared fields (timestamps, etc.)
- Document index and unique constraint requirements
- Ensure compatibility with Neon PostgreSQL

## Inputs
- Data model specifications
- Relational schema requirements
- API contract field requirements
- PostgreSQL-specific constraints
- Performance requirements (indexes)

## Outputs
- SQLModel class definitions
- Table schema documentation
- Request/response model variants
- Relationship configurations
- Index and constraint specifications
- Migration considerations

## Constraints
- Never mix table models with pure Pydantic models inappropriately
- Never expose internal database fields in API responses without consideration
- Never create models without proper field validation
- Never ignore PostgreSQL-specific type mappings
- Always use appropriate field types for PostgreSQL
- Always define relationships explicitly
- Always consider nullable fields and defaults

## Interaction With Other Skills
- **relational-data-modeling:** Implements relational design in SQLModel
- **python-backend-structure:** Fits within models/ directory
- **fastapi-architecture:** Provides models for dependency injection
- **neon-postgres-integration:** Ensures compatibility with Neon
- **rest-api-design:** Aligns models with API resource structure

## Anti-Patterns
- **Table confusion:** Forgetting table=True on database models
- **Validation skip:** Not leveraging Pydantic validation
- **Type mismatch:** Using Python types incompatible with PostgreSQL
- **Relationship ambiguity:** Unclear or missing relationship definitions
- **Field exposure:** Exposing sensitive fields like password hashes in responses
- **Over-modeling:** Creating too many model variants for same entity
- **Migration ignorance:** Designing schemas without considering migrations

## Phase Applicability
Phase II only. Phase I uses in-memory dataclass without database persistence.
