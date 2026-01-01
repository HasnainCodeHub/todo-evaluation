# Skill: fastapi-architecture

## Purpose
Design FastAPI application structure, routing, middleware, and separation of concerns. This skill establishes architectural patterns for building scalable, maintainable Python APIs that integrate with the monorepo structure and support Phase II authentication and data persistence requirements.

## When to Use
- When designing the overall FastAPI application structure
- When planning API routing and endpoint organization
- When establishing middleware chains and request processing
- When defining dependency injection patterns
- When creating architectural plans for backend features
- When integrating authentication and authorization middleware

## When NOT to Use
- When the backend technology hasn't been confirmed as FastAPI
- When working on frontend components
- When designing database schemas (use sqlmodel-design)
- When implementing specific endpoint logic
- When specifications haven't been validated

## Responsibilities
- Define FastAPI application factory pattern
- Establish router organization by domain/feature
- Design middleware stack for cross-cutting concerns
- Plan dependency injection structure
- Configure CORS, security headers, and request validation
- Integrate authentication middleware with JWT verification
- Establish error handling and response standardization
- Document API versioning strategy if applicable

## Inputs
- Validated backend specifications
- Monorepo structure and backend directory location
- Authentication requirements (JWT, Better Auth)
- Database integration requirements (SQLModel, Neon)
- API contract definitions
- Performance and security requirements

## Outputs
- FastAPI application structure diagram
- Router organization plan
- Middleware chain design
- Dependency injection patterns
- Error handling strategy
- API response format standards
- Integration points documentation

## Constraints
- Never mix routing logic with business logic
- Never bypass middleware for authenticated endpoints
- Never expose internal errors to API consumers
- Never create circular dependencies between routers
- Always use dependency injection for shared resources
- Always validate request data at the API boundary
- Always follow FastAPI best practices and conventions

## Interaction With Other Skills
- **python-backend-structure:** Operates within defined backend directory structure
- **rest-api-design:** Implements REST conventions in FastAPI routers
- **jwt-verification:** Integrates JWT middleware into FastAPI
- **sqlmodel-design:** Coordinates with database models for data access
- **monorepo-architecture:** Fits within monorepo backend layer

## Anti-Patterns
- **God router:** Single router handling all endpoints
- **Middleware bypass:** Authenticated endpoints without auth middleware
- **Direct DB access:** Controllers directly querying database without service layer
- **Response inconsistency:** Different response formats across endpoints
- **Error leakage:** Exposing stack traces or internal details in responses
- **Tight coupling:** Routers depending directly on concrete implementations
- **Configuration chaos:** Settings scattered across multiple locations

## Phase Applicability
Phase II only. Phase I uses console-based Python without API framework.
