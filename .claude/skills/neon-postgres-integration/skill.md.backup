# Skill: neon-postgres-integration

## Purpose
Integrate Neon Serverless PostgreSQL using environment-based configuration. This skill establishes patterns for connecting to Neon's serverless PostgreSQL, managing connection strings securely, and handling serverless-specific considerations.

## When to Use
- When setting up Neon PostgreSQL connection
- When configuring database connection strings
- When handling environment-based database configuration
- When managing connection pooling for serverless
- When troubleshooting database connectivity issues
- When planning database migrations with Neon

## When NOT to Use
- When using a different database provider
- When working on frontend code without database access
- When designing data models (use relational-data-modeling)
- When the database provider hasn't been confirmed
- When specifications don't require persistent storage

## Responsibilities
- Configure Neon connection string from environment
- Set up SQLModel/SQLAlchemy engine for Neon
- Handle serverless connection considerations
- Implement connection pooling if needed
- Secure database credentials management
- Configure SSL/TLS for database connections
- Handle connection timeouts and retries
- Document migration strategy for Neon

## Inputs
- Neon database credentials
- Environment configuration patterns
- SQLModel/SQLAlchemy requirements
- Connection pooling requirements
- SSL certificate requirements

## Outputs
- Database connection configuration
- Environment variable documentation
- Connection string patterns
- Engine/session factory setup
- Connection health check patterns
- Migration tooling configuration

## Constraints
- Never hardcode database credentials in source code
- Never commit connection strings to version control
- Never disable SSL for production connections
- Never ignore connection timeout settings
- Always use environment variables for credentials
- Always validate connection on application startup
- Always handle connection failures gracefully

## Interaction With Other Skills
- **sqlmodel-design:** Provides database engine for SQLModel operations
- **python-backend-structure:** Fits within backend configuration module
- **fastapi-architecture:** Integrates with FastAPI dependency injection
- **relational-data-modeling:** Supports defined relationships in Neon
- **constraint-enforcement:** Ensures secure credential handling

## Anti-Patterns
- **Credential exposure:** Hardcoding or logging database passwords
- **SSL bypass:** Disabling SSL for convenience
- **Connection leak:** Not properly closing database connections
- **Timeout ignore:** Not configuring appropriate timeout values
- **Single connection:** Not handling connection pooling for scale
- **Environment confusion:** Mixing development and production credentials
- **Migration skip:** Not planning for schema migrations

## Phase Applicability
Phase II only. Phase I uses in-memory storage without external database.
