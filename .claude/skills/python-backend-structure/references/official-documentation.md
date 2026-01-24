# Python Backend Structure Official Documentation and Standards

## Python Backend Architecture Overview

### Modern Python Backend Architecture
Modern Python backends typically follow a layered architecture pattern that separates concerns and promotes maintainability:

```
Layered Architecture:
┌─────────────────┐
│   Presentation  │ ← API Routers, Request/Response Models
├─────────────────┤
│    Business     │ ← Services, Business Logic, Validation
├─────────────────┤
│   Data Access   │ ← Repositories, Database Models, Queries
├─────────────────┤
│  Infrastructure │ ← Database Connections, Configuration, Utilities
└─────────────────┘
```

### FastAPI Project Structure Standards
The recommended FastAPI project structure follows Python packaging best practices:

```
my_fastapi_project/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application factory and lifespan
│   ├── config.py            # Configuration and settings
│   ├── database/            # Database connection and session management
│   │   ├── __init__.py
│   │   ├── base.py          # Base model and engine setup
│   │   └── session.py       # Session management
│   ├── models/              # SQLModel/SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   └── base.py          # Base model
│   ├── schemas/             # Pydantic request/response models
│   │   ├── __init__.py
│   │   ├── user.py          # User schemas
│   │   └── auth.py          # Authentication schemas
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── deps.py          # Dependency injection
│   │   ├── v1/              # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── auth.py      # Authentication routes
│   │   │   └── users.py     # User routes
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── user_service.py  # User business logic
│   │   └── auth_service.py  # Authentication logic
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── security.py      # Security utilities
│       └── validators.py    # Validation utilities
├── tests/                   # Test files
│   ├── __init__.py
│   ├── conftest.py          # Test fixtures
│   ├── test_users.py        # User tests
│   └── api/                 # API integration tests
│       ├── __init__.py
│       └── test_auth.py     # Auth API tests
├── requirements.txt         # Production dependencies
├── requirements-dev.txt     # Development dependencies
├── pyproject.toml          # Project configuration
├── Dockerfile              # Container configuration
└── README.md
```

## Layer Separation Standards

### 1. Presentation Layer (API Routes)
```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(deps.get_db)
):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)
```

### 2. Business Logic Layer (Services)
```python
# app/services/user_service.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def create_user(self, user: UserCreate) -> User:
        db_user = User(**user.dict())
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
```

### 3. Data Access Layer (CRUD Operations)
```python
# app/crud/user.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

### 4. Model Layer (Database Models)
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
```

## Configuration Management

### Settings Configuration Pattern
```python
# app/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database settings
    database_url: str = "sqlite:///./test.db"

    # API settings
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    # Security settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # External service settings
    external_api_url: str = "https://api.example.com"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Environment Configuration
```
# .env
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-super-secret-key-here
DEBUG=True
EXTERNAL_API_URL=https://api.external-service.com
```

## Dependency Injection Patterns

### FastAPI Dependency Injection
```python
# app/api/deps.py
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings

# Create database engine
engine = create_engine(settings.database_url)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to provide database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Testing Structure

### Test Organization
```
tests/
├── conftest.py              # Shared fixtures
├── test_config.py           # Configuration tests
├── test_models/             # Model-specific tests
│   ├── test_user_model.py
│   └── test_post_model.py
├── test_crud/               # CRUD operation tests
│   ├── test_user_crud.py
│   └── test_post_crud.py
├── test_api/                # API integration tests
│   ├── test_auth.py
│   └── test_users.py
└── utils/                   # Test utilities
    └── test_helpers.py
```

### Test Example
```python
# tests/test_users.py
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import get_db
from app.tests.conftest import override_get_db

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
```

## Package Structure Best Practices

### __init__.py Organization
```python
# app/__init__.py
from .main import app
from . import models, schemas, api

__version__ = "1.0.0"
__author__ = "Your Name"

# Export main application
__all__ = ["app"]
```

```python
# app/api/__init__.py
from .deps import get_db

__all__ = ["get_db"]
```

### Import Organization (PEP 8)
```python
# Standard library imports
import os
import sys
from pathlib import Path

# Third-party imports
import fastapi
from sqlalchemy import create_engine
from pydantic import BaseModel

# Local application imports
from app.models import User
from app.schemas import UserCreate
from app.crud import create_user
```

## Error Handling Patterns

### Custom Exception Handling
```python
# app/exceptions.py
class AppException(Exception):
    """Base application exception"""
    pass

class UserNotFoundException(AppException):
    """Raised when user is not found"""
    pass

class DuplicateEmailException(AppException):
    """Raised when email already exists"""
    pass
```

### HTTP Exception Handling
```python
# app/api/v1/users.py
from fastapi import HTTPException, status

@router.get("/{user_id}")
def get_user(user_id: int):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
```

## Security Considerations

### Security Best Practices
1. **Never hardcode secrets** - Use environment variables
2. **Validate all inputs** - Use Pydantic models
3. **Sanitize outputs** - Remove sensitive data from responses
4. **Use HTTPS** - Always in production
5. **Implement rate limiting** - Prevent abuse
6. **Log security events** - Monitor for threats

### Secure Configuration Loading
```python
# app/security.py
import secrets
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def generate_secret_key() -> str:
    """Generate a secure random secret key"""
    return secrets.token_urlsafe(32)
```

## Performance Optimization

### Connection Pooling
```python
# app/database/base.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

def create_engine_with_pool():
    return create_engine(
        settings.database_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
    )
```

### Caching Strategies
```python
# app/cache.py
import redis
from app.config import settings

# Redis cache connection
cache = redis.Redis.from_url(settings.redis_url)

def get_cached_data(key: str):
    """Get data from cache"""
    data = cache.get(key)
    if data:
        return json.loads(data)
    return None

def set_cached_data(key: str, data: dict, ttl: int = 300):
    """Set data in cache with TTL"""
    cache.setex(key, ttl, json.dumps(data))
```

## Monitoring and Logging

### Structured Logging
```python
# app/logging.py
import logging
import structlog
from pythonjsonlogger import jsonlogger

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
```

These patterns and standards ensure clean, maintainable Python backend code structure following industry best practices.