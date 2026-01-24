# Neon PostgreSQL Integration Implementation Patterns

## Basic Connection Setup

### SQLAlchemy Engine Configuration
```python
# database/engine.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool
import os

def create_neon_engine():
    """
    Create SQLAlchemy engine configured for Neon PostgreSQL
    """
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")

    # Neon-specific configuration
    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=5,                    # Conservative for serverless
        max_overflow=10,               # Allow some additional connections
        pool_pre_ping=True,            # Verify connections before use
        pool_recycle=300,              # Recycle connections every 5 minutes
        pool_timeout=30,               # 30 seconds to get connection from pool
        echo=False,                    # Set to True for debugging
        connect_args={
            "connect_timeout": 10,      # 10 second connection timeout
            "sslmode": "require"        # Require SSL connection
        }
    )

    return engine

# Global engine instance
engine = create_neon_engine()

# Session factory
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### SQLModel Integration
```python
# database/models.py
from sqlmodel import SQLModel, Field, create_engine
from sqlalchemy.pool import QueuePool
import os

def create_neon_sqlmodel_engine():
    """
    Create SQLModel engine configured for Neon PostgreSQL
    """
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")

    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )

    return engine

def initialize_database():
    """
    Initialize database tables
    """
    engine = create_neon_sqlmodel_engine()
    SQLModel.metadata.create_all(bind=engine)
    return engine
```

## FastAPI Integration Patterns

### Dependency Injection
```python
# database/dependencies.py
from typing import Generator
from sqlmodel import Session
from database.engine import SessionLocal

def get_db_session() -> Generator[Session, None, None]:
    """
    Dependency to provide database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In your FastAPI app
from fastapi import Depends
from sqlmodel import Session

@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.id == user_id).first()
    return user
```

### Startup/Shutdown Events
```python
# main.py
from fastapi import FastAPI
from database.engine import engine
from database.models import initialize_database

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    """
    Initialize database on startup
    """
    try:
        initialize_database()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup database connections on shutdown
    """
    engine.dispose()
    print("Database connections disposed")
```

## Async Patterns

### Async SQLAlchemy with Neon
```python
# database/async_engine.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

def create_neon_async_engine():
    """
    Create async SQLAlchemy engine for Neon
    """
    database_url = os.getenv("DATABASE_URL")

    # Add asyncpg driver to connection string
    if database_url and "driver" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

    engine = create_async_engine(
        database_url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )

    return engine

# Async session factory
AsyncSessionLocal = sessionmaker(
    bind=create_neon_async_engine(),
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_async_db_session():
    """
    Async dependency for database session
    """
    async with AsyncSessionLocal() as session:
        yield session
```

### Async FastAPI Integration
```python
# routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.async_engine import get_async_db_session

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user_async(
    user_id: int,
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Async endpoint to get user
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    return user
```

## Connection Management Patterns

### Context Manager for Connections
```python
# database/connection_manager.py
from contextlib import contextmanager
from sqlalchemy.orm import Session
from database.engine import SessionLocal

@contextmanager
def get_db():
    """
    Context manager for database sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Usage
def create_user(user_data):
    with get_db() as db:
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
```

### Connection Pool Monitoring
```python
# database/monitoring.py
from sqlalchemy import event
from sqlalchemy.pool import Pool
import logging

logger = logging.getLogger(__name__)

@event.listens_for(Pool, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Log connection events
    """
    logger.info(f"New connection established to Neon DB")

@event.listens_for(Pool, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """
    Log when connection is checked out from pool
    """
    logger.debug(f"Connection checked out from pool")

@event.listens_for(Pool, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    """
    Log when connection is returned to pool
    """
    logger.debug(f"Connection returned to pool")
```

## Error Handling Patterns

### Connection Retry Logic
```python
# database/retry.py
import time
import random
from functools import wraps
from sqlalchemy.exc import DisconnectionError, OperationalError
import logging

logger = logging.getLogger(__name__)

def retry_on_disconnect(max_retries=3, base_delay=1):
    """
    Decorator to retry database operations on disconnection
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (DisconnectionError, OperationalError) as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries exceeded for {func.__name__}: {e}")
                        raise e

                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Retry {attempt + 1}/{max_retries} for {func.__name__} after {delay:.2f}s: {e}")
                    time.sleep(delay)

            raise Exception("Max retries exceeded")
        return wrapper
    return decorator

# Usage
@retry_on_disconnect(max_retries=3)
def get_user_by_id(user_id: int, db: Session):
    return db.query(User).filter(User.id == user_id).first()
```

### Health Check Implementation
```python
# database/health.py
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from database.engine import engine
import logging

logger = logging.getLogger(__name__)

def check_database_health():
    """
    Check if database is reachable and responsive
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            if result.fetchone() is not None:
                return {"status": "healthy", "ping": True}
            else:
                return {"status": "unhealthy", "ping": False}
    except SQLAlchemyError as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "ping": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error during health check: {e}")
        return {"status": "unhealthy", "ping": False, "error": str(e)}

# Async health check
async def check_database_health_async():
    """
    Async version of database health check
    """
    from database.async_engine import async_engine

    try:
        async with async_engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            if result.fetchone() is not None:
                return {"status": "healthy", "ping": True}
            else:
                return {"status": "unhealthy", "ping": False}
    except Exception as e:
        logger.error(f"Async database health check failed: {e}")
        return {"status": "unhealthy", "ping": False, "error": str(e)}
```

## Migration Patterns

### Alembic Configuration for Neon
```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os

# Import your SQLModel models
from database.models import SQLModel

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

def get_url():
    return os.getenv("DATABASE_URL")

def run_migrations_offline():
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Migration Script Example
```python
# alembic/versions/001_initial_tables.py
"""Initial tables

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

def downgrade():
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
```

## Performance Optimization

### Query Optimization for Neon
```python
# database/optimization.py
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database.models import User, Post

def get_user_with_posts_optimized(user_id: int, db: Session):
    """
    Optimized query using selectinload to prevent N+1 queries
    """
    stmt = select(User).options(selectinload(User.posts)).where(User.id == user_id)
    return db.exec(stmt).first()

def batch_insert_users(users_data: list, db: Session):
    """
    Efficiently insert multiple users in a single transaction
    """
    users = [User(**user_data) for user_data in users_data]
    db.add_all(users)
    db.commit()

    # Refresh to get auto-generated IDs
    for user in users:
        db.refresh(user)

    return users
```

### Connection Pool Tuning
```python
# database/pool_config.py
from sqlalchemy.pool import QueuePool
import os

def get_pool_config():
    """
    Get optimal pool configuration based on environment
    """
    env = os.getenv("ENVIRONMENT", "development")

    if env == "production":
        return {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 30
        }
    else:  # development/staging
        return {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 30
        }

def create_optimized_engine():
    """
    Create engine with environment-optimized settings
    """
    database_url = os.getenv("DATABASE_URL")
    pool_config = get_pool_config()

    return create_engine(
        database_url,
        poolclass=QueuePool,
        **pool_config,
        echo=(os.getenv("DEBUG", "").lower() == "true")
    )
```

## Testing Patterns

### Test Database Configuration
```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel
from database.models import User
from database.engine import SessionLocal

@pytest.fixture(scope="session")
def test_engine():
    """
    Create test database engine with in-memory SQLite for testing
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )

    # Create all tables
    SQLModel.metadata.create_all(bind=engine)
    yield engine

    engine.dispose()

@pytest.fixture
def test_db_session(test_engine):
    """
    Create test database session with rollback after each test
    """
    with SessionLocal(bind=test_engine) as session:
        yield session

        # Rollback any changes
        session.rollback()
```

### Neon-Specific Test Patterns
```python
# tests/test_neon_integration.py
import pytest
from unittest.mock import patch
from database.connection_manager import get_db
from database.health import check_database_health

def test_neon_connection_health():
    """
    Test that database health check works
    """
    health = check_database_health()
    assert health["status"] in ["healthy", "unhealthy"]

@patch('database.engine.SessionLocal')
def test_db_session_context_manager(mock_session_local):
    """
    Test database session context manager
    """
    mock_session = mock_session_local.return_value.__enter__.return_value

    with get_db() as db:
        assert db is mock_session

    mock_session_local.return_value.__exit__.assert_called_once()
```

## Environment-Specific Configurations

### Multi-Environment Setup
```python
# config/database.py
import os
from urllib.parse import urlparse

class DatabaseConfig:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")

        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

    def get_neon_config(self):
        """
        Get Neon-specific configuration based on the database URL
        """
        parsed = urlparse(self.database_url)

        return {
            "host": parsed.hostname,
            "port": parsed.port,
            "database": parsed.path.lstrip('/'),
            "username": parsed.username,
            "password": parsed.password,
            "ssl_required": "sslmode=require" in self.database_url
        }

    def get_pool_settings(self):
        """
        Get pool settings based on environment
        """
        env = os.getenv("ENVIRONMENT", "development")

        base_settings = {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 30
        }

        if env == "production":
            base_settings.update({
                "pool_size": 10,
                "max_overflow": 20
            })
        elif env == "testing":
            base_settings.update({
                "pool_size": 1,
                "max_overflow": 0
            })

        return base_settings
```

These implementation patterns provide a comprehensive guide for integrating Neon PostgreSQL with Python applications, focusing on serverless-specific optimizations and best practices.