# Database Module
# Phase 2.1: Database Persistence Layer
# Task ID: T006-T008 (Foundational), T022-T024 (US4: Connection Management)

from contextlib import contextmanager
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings

# Global engine instance - created once, shared across the application
_engine = None


def get_engine():
    """
    Get or create the database engine.

    Implements FR-011: Support Neon Serverless PostgreSQL.

    The engine is created once and cached for reuse.
    Uses SSL mode required for Neon connections.
    """
    global _engine

    if _engine is None:
        settings = get_settings()

        # Create engine with connection arguments for Neon
        # sslmode=require is typically in the connection string from Neon
        _engine = create_engine(
            settings.database_url_sync,
            echo=False,  # Set to True for SQL debugging
            pool_pre_ping=True,  # Verify connections before use
        )

    return _engine


@contextmanager
def get_session() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.

    Implements proper session lifecycle management:
    - Creates a new session
    - Yields it for use
    - Commits on success
    - Rolls back on exception
    - Always closes the session

    Usage:
        with get_session() as session:
            # Use session for database operations
            session.add(task)
            session.commit()
    """
    engine = get_engine()
    session = Session(engine)

    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """
    Initialize database tables.

    Implements FR-012: Function to initialize database tables on first run.

    Uses SQLModel.metadata.create_all() which is idempotent -
    safe to run multiple times, only creates tables that don't exist.

    Note: This does NOT use migrations (FR-017 constraint).
    """
    # Import models to ensure they're registered with SQLModel metadata
    from .models import Task  # noqa: F401

    engine = get_engine()
    SQLModel.metadata.create_all(engine)
