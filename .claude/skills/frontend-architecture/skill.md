# Skill: frontend-architecture

## Purpose
Structure frontend code for scalability, readability, and API interaction. This skill establishes patterns for organizing frontend code beyond routing, including component organization, state management, and integration with backend APIs.

## When to Use
- When designing overall frontend code organization
- When planning component library structure
- When establishing state management patterns
- When defining API integration patterns
- When creating reusable component systems
- When scaling frontend codebase organization

## When NOT to Use
- When working on backend code
- When designing routing (use nextjs-app-router)
- When implementing specific components
- When specifications haven't defined frontend requirements
- When frontend technology stack isn't confirmed

## Responsibilities
- Define component directory structure
- Establish component categorization (ui, features, layouts)
- Plan state management approach
- Design hook organization and patterns
- Configure utility and helper organization
- Establish type definitions structure
- Document component composition patterns
- Plan for code splitting and lazy loading

## Inputs
- Next.js App Router structure
- UI/UX requirements from specifications
- API contract definitions
- State management requirements
- Performance requirements

## Outputs
- Frontend directory structure diagram
- Component organization guidelines
- State management patterns
- Hook organization documentation
- Type definition conventions
- Code splitting strategy

## Constraints
- Never mix feature logic with UI components
- Never create circular dependencies between components
- Never scatter state management across components without pattern
- Never ignore TypeScript type definitions
- Always separate concerns between layers
- Always maintain consistent naming conventions
- Always document component APIs (props interfaces)

## Interaction With Other Skills
- **nextjs-app-router:** Provides routing context for architecture
- **api-client-design:** Integrates API clients into architecture
- **auth-aware-ui:** Coordinates auth state within architecture
- **better-auth-integration:** Houses auth integration code
- **monorepo-architecture:** Fits within monorepo frontend directory

## Anti-Patterns
- **Component soup:** All components in single directory
- **Prop drilling:** Passing props through many component layers
- **State scatter:** State management without clear patterns
- **Type absence:** Missing TypeScript interfaces and types
- **Utility chaos:** Helper functions scattered without organization
- **Coupling excess:** Components tightly coupled to each other
- **Naming inconsistency:** Different naming conventions throughout

## Phase Applicability
Phase II only. Phase I uses console interface without web frontend.
