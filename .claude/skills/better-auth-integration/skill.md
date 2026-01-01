# Skill: better-auth-integration

## Purpose
Configure Better Auth on the frontend and coordinate JWT issuance. This skill establishes patterns for integrating Better Auth as the authentication provider, handling user sessions, and coordinating token issuance for backend API authentication.

## When to Use
- When setting up Better Auth in Next.js frontend
- When configuring authentication providers (email, OAuth)
- When handling user session management
- When coordinating JWT token issuance
- When implementing login/logout flows
- When troubleshooting authentication issues

## When NOT to Use
- When working on backend JWT verification (use jwt-verification)
- When designing overall auth flow (use jwt-authentication)
- When Better Auth isn't the chosen auth provider
- When working on unauthenticated features
- When the auth provider hasn't been confirmed

## Responsibilities
- Configure Better Auth client in Next.js
- Set up authentication providers
- Handle user session state
- Coordinate JWT token issuance and refresh
- Implement secure token storage (httpOnly cookies)
- Configure auth callbacks and redirects
- Handle authentication errors gracefully
- Document auth configuration requirements

## Inputs
- Better Auth documentation and requirements
- Authentication provider configurations
- Next.js App Router structure
- Session management requirements
- JWT token requirements for backend

## Outputs
- Better Auth client configuration
- Auth provider setup
- Session management patterns
- Token issuance configuration
- Login/logout flow documentation
- Error handling patterns

## Constraints
- Never store tokens in localStorage (use httpOnly cookies)
- Never expose auth secrets in client-side code
- Never skip CSRF protection
- Never ignore token expiration handling
- Always use HTTPS for auth operations
- Always validate redirect URLs
- Always handle auth errors with user-friendly messages

## Interaction With Other Skills
- **jwt-authentication:** Operates within broader auth flow design
- **jwt-verification:** Provides tokens for backend verification
- **nextjs-app-router:** Integrates with App Router patterns
- **auth-aware-ui:** Provides auth state for UI components
- **auth-boundary-design:** Coordinates with frontend auth boundary

## Anti-Patterns
- **Token exposure:** Storing tokens in localStorage or exposing in URLs
- **Secret leakage:** Including auth secrets in client bundles
- **Session confusion:** Inconsistent session state across components
- **Redirect vulnerability:** Not validating redirect URLs
- **Error swallowing:** Hiding auth errors from users
- **CSRF ignorance:** Not implementing CSRF protection
- **Refresh neglect:** Not handling token refresh properly

## Phase Applicability
Phase II only. Phase I has no authentication requirements.
