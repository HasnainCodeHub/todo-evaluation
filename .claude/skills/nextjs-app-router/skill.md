# Skill: nextjs-app-router

## Purpose
Design Next.js App Router structure with server/client components. This skill establishes patterns for organizing Next.js applications using the App Router paradigm, correctly separating server and client components, and leveraging Next.js features effectively.

## When to Use
- When designing Next.js application structure
- When planning route organization with App Router
- When deciding server vs client component boundaries
- When implementing layouts and nested routing
- When planning data fetching patterns
- When optimizing for server-side rendering

## When NOT to Use
- When working on backend code
- When the frontend framework isn't Next.js
- When using Pages Router instead of App Router
- When designing API contracts (use rest-api-design)
- When frontend technology hasn't been confirmed

## Responsibilities
- Design app/ directory structure
- Plan route grouping and organization
- Define server vs client component boundaries
- Establish layout and template patterns
- Configure loading and error boundaries
- Plan metadata and SEO strategy
- Design parallel and intercepting routes if needed
- Document data fetching patterns per route

## Inputs
- Feature specifications with UI requirements
- Frontend architecture requirements
- Authentication integration needs
- Performance requirements
- SEO and metadata requirements

## Outputs
- App directory structure diagram
- Route organization plan
- Server/client component boundary documentation
- Layout hierarchy design
- Loading and error state patterns
- Metadata strategy documentation

## Constraints
- Never use client components unnecessarily
- Never fetch data in client components when server fetch is possible
- Never ignore loading and error states
- Never create deeply nested route structures without justification
- Always prefer server components by default
- Always define clear component boundaries
- Always implement proper loading states

## Interaction With Other Skills
- **frontend-architecture:** Operates within broader frontend structure
- **better-auth-integration:** Coordinates auth with App Router patterns
- **api-client-design:** Integrates API calls with routing
- **auth-aware-ui:** Coordinates protected routes
- **monorepo-architecture:** Fits within monorepo frontend directory

## Anti-Patterns
- **Client overuse:** Making everything a client component
- **Waterfall fetching:** Nested data fetches that could be parallelized
- **Layout leakage:** Not leveraging layouts for shared UI
- **Route chaos:** Disorganized route structure without grouping
- **Loading neglect:** Missing loading states causing poor UX
- **Error swallowing:** Not handling route-level errors
- **Metadata absence:** Missing SEO and metadata configuration

## Phase Applicability
Phase II only. Phase I uses console interface without web frontend.
