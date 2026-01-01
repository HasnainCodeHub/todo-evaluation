# Skill: auth-boundary-design

## Purpose
Enforce clear security boundaries between frontend auth and backend authorization. This skill establishes patterns for separating authentication (identity verification) from authorization (permission enforcement), ensuring each layer has appropriate responsibilities.

## When to Use
- When designing security boundaries between frontend and backend
- When planning authorization rules for API endpoints
- When establishing user permission patterns
- When defining resource access control
- When ensuring data isolation by user ownership
- When documenting security architecture

## When NOT to Use
- When implementing authentication flows (use jwt-authentication)
- When configuring frontend auth (use better-auth-integration)
- When verifying tokens (use jwt-verification)
- When security requirements haven't been defined
- When working on unauthenticated features

## Responsibilities
- Define authentication vs authorization boundaries
- Establish frontend security responsibilities
- Define backend authorization enforcement points
- Plan resource ownership validation
- Document permission model (if applicable)
- Ensure all protected resources enforce authorization
- Coordinate auth boundaries across layers
- Define clear security contract between layers

## Inputs
- Authentication architecture from jwt-authentication
- API endpoint definitions
- Resource ownership requirements
- User data isolation requirements
- Security specifications

## Outputs
- Security boundary documentation
- Authorization enforcement patterns
- Resource access control rules
- Layer responsibility matrix
- Security contract documentation
- Audit logging requirements

## Constraints
- Never trust frontend for authorization decisions
- Never skip authorization checks on protected endpoints
- Never expose other users' data through authorization gaps
- Never implement authorization without authentication
- Always validate resource ownership on backend
- Always enforce authorization at API boundary
- Always document security boundaries clearly

## Interaction With Other Skills
- **jwt-authentication:** Operates on top of authentication flow
- **jwt-verification:** Uses verified identity for authorization
- **rest-api-design:** Enforces authorization on API endpoints
- **relational-data-modeling:** Coordinates with ownership relationships
- **fastapi-architecture:** Integrates authorization middleware

## Anti-Patterns
- **Frontend trust:** Relying on frontend for authorization decisions
- **Boundary blur:** Mixing authentication and authorization code
- **Ownership skip:** Not validating resource ownership
- **All-or-nothing:** Only having authenticated/unauthenticated states
- **Implicit authorization:** Assuming auth equals access
- **Inconsistent enforcement:** Different authorization patterns per endpoint
- **Audit absence:** Not logging authorization decisions

## Phase Applicability
Phase II only. Phase I has no authentication or multi-user concerns.
