# Skill: rest-api-design

## Purpose
Define RESTful API behavior, HTTP methods, status codes, and endpoint conventions. This skill ensures consistent, standards-compliant API design that follows REST principles and provides predictable, well-documented interfaces for frontend consumption.

## When to Use
- When designing new API endpoints
- When establishing HTTP method conventions (GET, POST, PUT, DELETE)
- When defining response status codes and error formats
- When creating API contract documentation
- When reviewing existing endpoints for REST compliance
- When planning resource naming and URL structure

## When NOT to Use
- When working on frontend implementation
- When designing internal service-to-service communication
- When the API style has been decided as non-REST (GraphQL, gRPC)
- When implementing endpoint logic (use fastapi-architecture)
- When specifications haven't defined the API requirements

## Responsibilities
- Define resource naming conventions (plural nouns, lowercase)
- Establish HTTP method semantics for CRUD operations
- Document standard response status codes
- Design error response format and error codes
- Plan pagination patterns for list endpoints
- Define query parameter conventions
- Establish request/response body structures
- Create API versioning strategy if needed

## Inputs
- Feature specifications with API requirements
- Data model definitions
- Authentication requirements
- Frontend consumption patterns
- Performance requirements
- Existing API conventions (if any)

## Outputs
- Endpoint URL patterns
- HTTP method assignments
- Status code mappings
- Error response schema
- Request/response body schemas
- API contract documentation (OpenAPI/Swagger)
- Pagination and filtering patterns

## Constraints
- Never use verbs in resource URLs (use nouns)
- Never return 200 OK for error conditions
- Never expose internal IDs or implementation details inappropriately
- Never ignore HTTP method semantics (GET must be safe and idempotent)
- Always use appropriate status codes (201 for creation, 204 for no content)
- Always provide consistent error response format
- Always document all endpoints in contracts

## Interaction With Other Skills
- **fastapi-architecture:** Implements REST conventions in FastAPI structure
- **api-client-design:** Consumes REST patterns for frontend API clients
- **spec-writing:** Incorporates REST conventions into specifications
- **jwt-authentication:** Coordinates with auth headers and 401/403 responses
- **relational-data-modeling:** Aligns resources with data model entities

## Anti-Patterns
- **Verb pollution:** Using verbs in URLs like /getUsers or /createTask
- **Status code abuse:** Using 200 for everything including errors
- **Inconsistent naming:** Mixing /user and /tasks (singular vs plural)
- **Over-nesting:** Deep URL hierarchies like /users/1/tasks/2/comments/3/replies
- **Method misuse:** Using POST for retrieval or GET for mutations
- **Missing pagination:** List endpoints without pagination support
- **Undocumented errors:** Error responses without clear codes or messages

## Phase Applicability
Phase II only. Phase I uses console interface without HTTP API.
