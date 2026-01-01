# Skill: auth-aware-ui

## Purpose
Design UI behavior that responds to authentication state correctly. This skill establishes patterns for building user interfaces that adapt to authentication state, protecting routes, showing appropriate content, and handling authentication transitions smoothly.

## When to Use
- When designing protected routes and pages
- When planning conditional UI based on auth state
- When implementing login/logout UI flows
- When handling authentication loading states
- When designing auth-dependent navigation
- When creating user profile and account UI

## When NOT to Use
- When working on backend code
- When implementing authentication logic (use better-auth-integration)
- When designing API clients (use api-client-design)
- When auth requirements haven't been defined
- When working on public/unauthenticated features

## Responsibilities
- Design protected route patterns
- Establish auth state UI patterns
- Plan loading states during auth checks
- Create login/logout UI flows
- Design conditional navigation
- Implement auth error display
- Plan redirect flows for unauthenticated users
- Document auth-aware component patterns

## Inputs
- Authentication state from Better Auth
- Route protection requirements
- UI/UX specifications
- Navigation structure
- Error handling requirements

## Outputs
- Protected route patterns
- Auth-aware component patterns
- Loading state designs
- Login/logout flow documentation
- Navigation adaptation rules
- Error display patterns

## Constraints
- Never show protected content before auth verification
- Never flash protected content during auth check
- Never ignore authentication errors in UI
- Never create confusing auth state transitions
- Always show loading during auth checks
- Always provide clear feedback on auth state
- Always handle auth errors gracefully with user messaging

## Interaction With Other Skills
- **better-auth-integration:** Consumes authentication state
- **nextjs-app-router:** Coordinates with route protection
- **frontend-architecture:** Fits within component organization
- **api-client-design:** Coordinates with authenticated API calls
- **jwt-authentication:** Responds to token state changes

## Anti-Patterns
- **Content flash:** Showing protected content before auth check completes
- **Loading absence:** No loading state during auth verification
- **Error hiding:** Not showing auth errors to users
- **Redirect loop:** Infinite redirects between auth and protected pages
- **State inconsistency:** Different auth state in different components
- **Navigation confusion:** Unclear navigation based on auth state
- **Logout neglect:** Not handling logout state properly

## Phase Applicability
Phase II only. Phase I has no authentication or UI requirements.
