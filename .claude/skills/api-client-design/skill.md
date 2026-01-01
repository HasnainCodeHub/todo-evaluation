# Skill: api-client-design

## Purpose
Create frontend API clients that communicate securely with backend endpoints. This skill establishes patterns for building type-safe, maintainable API clients that handle authentication, error responses, and data transformation.

## When to Use
- When designing API client architecture
- When planning request/response handling patterns
- When establishing error handling strategies
- When implementing authentication in API calls
- When creating typed API client functions
- When centralizing API communication logic

## When NOT to Use
- When working on backend API implementation
- When designing API contracts (use rest-api-design)
- When the API hasn't been defined
- When working on components without API needs
- When specifications don't require API communication

## Responsibilities
- Design API client module structure
- Establish base fetch/axios configuration
- Implement authentication header injection
- Create typed request/response interfaces
- Plan error handling and transformation
- Design retry and timeout strategies
- Document API client usage patterns
- Handle token refresh in API calls

## Inputs
- API contract definitions
- REST API design patterns
- Authentication token patterns
- Frontend architecture structure
- Error handling requirements

## Outputs
- API client module structure
- Base client configuration
- Typed API functions per endpoint
- Error handling patterns
- Request/response interceptors
- Usage documentation

## Constraints
- Never hardcode API base URLs
- Never skip error handling in API calls
- Never expose raw error responses to UI
- Never ignore authentication requirements
- Always type request and response data
- Always centralize API configuration
- Always handle network failures gracefully

## Interaction With Other Skills
- **rest-api-design:** Consumes API contract definitions
- **jwt-authentication:** Integrates token handling in requests
- **frontend-architecture:** Fits within frontend code structure
- **better-auth-integration:** Coordinates with auth token provision
- **auth-aware-ui:** Provides API call results for UI state

## Anti-Patterns
- **Scattered fetch:** API calls spread throughout components
- **Type absence:** Untyped request/response handling
- **Error swallowing:** Not handling or displaying API errors
- **URL hardcoding:** API URLs hardcoded in multiple places
- **Auth inconsistency:** Different auth patterns per endpoint
- **Retry chaos:** No consistent retry or timeout strategy
- **Transform duplication:** Same data transformation in multiple places

## Phase Applicability
Phase II only. Phase I has no API communication requirements.
