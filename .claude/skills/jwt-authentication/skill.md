# Skill: jwt-authentication

## Purpose
Define authentication flow using JWT between frontend and backend. This skill establishes the end-to-end authentication architecture, coordinating token issuance on the frontend with verification on the backend to enable secure, stateless authentication.

## When to Use
- When designing the overall authentication architecture
- When planning token flow between frontend and backend
- When establishing token format and claims structure
- When defining authentication state machine
- When planning token refresh and expiration handling
- When documenting authentication requirements

## When NOT to Use
- When implementing frontend auth details (use better-auth-integration)
- When implementing backend verification (use jwt-verification)
- When working on authorization (use auth-boundary-design)
- When authentication approach hasn't been decided
- When specifications don't require authentication

## Responsibilities
- Design end-to-end authentication flow
- Define JWT token structure and claims
- Plan token issuance and refresh lifecycle
- Establish token transmission patterns (headers, cookies)
- Document authentication state transitions
- Coordinate frontend and backend auth responsibilities
- Define session duration and refresh policies
- Plan logout and token invalidation

## Inputs
- Authentication requirements from specifications
- Frontend technology (Next.js, Better Auth)
- Backend technology (FastAPI)
- Security requirements
- User experience requirements

## Outputs
- Authentication flow diagram
- JWT token structure specification
- Token lifecycle documentation
- API authentication patterns
- Session management strategy
- Error handling specifications

## Constraints
- Never design for stateful sessions (use stateless JWT)
- Never include sensitive data in JWT payload
- Never ignore token expiration requirements
- Never design without refresh token strategy
- Always use HTTPS for token transmission
- Always define clear authentication boundaries
- Always document token claims thoroughly

## Interaction With Other Skills
- **better-auth-integration:** Implements frontend portion of auth flow
- **jwt-verification:** Implements backend portion of auth flow
- **auth-boundary-design:** Defines authorization after authentication
- **rest-api-design:** Coordinates auth headers with API design
- **frontend-architecture:** Influences frontend auth state management

## Anti-Patterns
- **Stateful creep:** Introducing server-side session state
- **Token bloat:** Including unnecessary data in JWT payload
- **Expiration ignore:** Not planning for token expiration
- **Single token:** Not having refresh token strategy
- **Insecure transmission:** Allowing tokens over HTTP
- **Boundary blur:** Mixing authentication and authorization
- **Flow ambiguity:** Unclear token lifecycle documentation

## Phase Applicability
Phase II only. Phase I has no authentication requirements.
