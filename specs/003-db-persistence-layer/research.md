# Research: Database Persistence Layer (Phase 2.1)

**Feature**: 003-db-persistence-layer
**Date**: 2026-01-01
**Status**: Complete

## Research Questions

### RQ-001: SQLModel Sync vs Async Pattern

**Question**: Should the data access layer use synchronous or asynchronous database operations?

**Decision**: Synchronous operations with standard SQLModel Session

**Rationale**:
- Phase 2.1 is data-layer only; no FastAPI integration yet
- Synchronous code is simpler to test and debug
- Phase 2.2 will introduce async when FastAPI requires it
- SQLModel supports both patterns; sync is the default

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Async with asyncpg | Adds complexity without benefit in Phase 2.1 |
| Async from start | Premature optimization; can migrate in Phase 2.2 |

---

### RQ-002: Neon PostgreSQL Connection Strategy

**Question**: How should the application connect to Neon Serverless PostgreSQL?

**Decision**: Use standard PostgreSQL connection string with psycopg2 driver

**Rationale**:
- Neon is PostgreSQL-compatible; standard drivers work
- psycopg2 is mature and well-supported with SQLModel
- Connection string format: `postgresql://user:pass@host/db?sslmode=require`
- SSL required for Neon connections

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| asyncpg | Async not needed in Phase 2.1 |
| pg8000 | Less common; psycopg2 has better ecosystem |
| Neon-specific SDK | No special SDK needed; standard PostgreSQL works |

---

### RQ-003: Environment Variable Configuration

**Question**: How should database credentials be managed?

**Decision**: Single DATABASE_URL environment variable with python-dotenv

**Rationale**:
- Industry standard for database configuration
- Neon provides connection strings in this format
- python-dotenv handles .env files for local development
- Secure: credentials never in code

**Configuration Pattern**:
```
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Separate env vars (host, user, pass) | More complex; Neon provides single URL |
| Config file | Less secure; harder to manage per environment |
| Hardcoded defaults | Violates security best practices |

---

### RQ-004: Session Management Pattern

**Question**: How should database sessions be managed across operations?

**Decision**: Context manager pattern with explicit session per operation

**Rationale**:
- SQLModel Session as context manager ensures proper cleanup
- Each data-access function receives or creates a session
- Supports both standalone use and transaction grouping
- Pattern: `with Session(engine) as session:`

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Global session | Not thread-safe; connection issues |
| Dependency injection | Adds complexity; better for Phase 2.2 with FastAPI |
| Connection pooling | Neon handles pooling server-side |

---

### RQ-005: Table Creation Strategy

**Question**: How should tables be created on first run?

**Decision**: Use SQLModel.metadata.create_all() with if_exists check

**Rationale**:
- Simple and idempotent
- No migration tooling needed for Phase 2.1
- Tables created if they don't exist
- Safe to run on every startup

**Code Pattern**:
```python
SQLModel.metadata.create_all(engine)  # Idempotent
```

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Alembic migrations | Out of scope for Phase 2.1 per spec |
| Manual SQL scripts | Violates FR-016 (no raw SQL) |
| Check-then-create | create_all is already idempotent |

---

## Technology Decisions Summary

| Component | Decision | Constitution Alignment |
|-----------|----------|----------------------|
| ORM | SQLModel | ✅ Phase II spec |
| Database | Neon PostgreSQL | ✅ Phase II spec |
| Driver | psycopg2 | ✅ Standard for SQLModel |
| Config | python-dotenv | ✅ Best practice |
| Pattern | Sync operations | ✅ Simpler for data-layer only |

## Dependencies

```
sqlmodel>=0.0.14
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
```

## Next Steps

1. Generate data-model.md with Task entity definition
2. Generate quickstart.md with verification steps
3. Complete plan.md with execution strategy
