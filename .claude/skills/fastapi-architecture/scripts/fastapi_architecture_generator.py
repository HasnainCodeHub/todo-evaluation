#!/usr/bin/env python3
"""
FastAPI Architecture Generator

This script generates a complete FastAPI application structure based on best practices,
including directory structure, dependency injection patterns, middleware, and security configurations.
"""

import os
import sys
from pathlib import Path
import argparse
import json
from typing import Dict, Any, List


def create_directory_structure(base_dir: str, project_name: str) -> str:
    """Create the FastAPI directory structure."""

    base_path = Path(base_dir) / project_name
    base_path.mkdir(parents=True, exist_ok=True)

    # Create directory structure
    dirs = [
        base_path / "app",
        base_path / "app" / "core",
        base_path / "app" / "api",
        base_path / "app" / "api" / "v1",
        base_path / "app" / "models",
        base_path / "app" / "schemas",
        base_path / "app" / "database",
        base_path / "app" / "services",
        base_path / "app" / "utils",
        base_path / "app" / "exceptions",
        base_path / "tests",
        base_path / "tests" / "api",
        base_path / "tests" / "services",
        base_path / "tests" / "database",
        base_path / "alembic",
        base_path / "alembic" / "versions",
    ]

    # Create all directories
    for directory in dirs:
        directory.mkdir(parents=True, exist_ok=True)

    return f"Directory structure created in {base_path}/"


def create_init_files(base_dir: str, project_name: str) -> str:
    """Create __init__.py files in all directories."""

    base_path = Path(base_dir) / project_name

    # Create __init__.py files
    init_paths = [
        base_path / "app" / "__init__.py",
        base_path / "app" / "core" / "__init__.py",
        base_path / "app" / "api" / "__init__.py",
        base_path / "app" / "api" / "v1" / "__init__.py",
        base_path / "app" / "models" / "__init__.py",
        base_path / "app" / "schemas" / "__init__.py",
        base_path / "app" / "database" / "__init__.py",
        base_path / "app" / "services" / "__init__.py",
        base_path / "app" / "utils" / "__init__.py",
        base_path / "app" / "exceptions" / "__init__.py",
    ]

    for init_path in init_paths:
        init_path.touch(exist_ok=True)

    return "__init__.py files created"


def create_main_app_file(base_dir: str, project_name: str) -> str:
    """Create the main FastAPI application file."""

    main_content = '''from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.middleware import setup_middleware
from app.core.events import setup_events
from app.core.security import setup_security


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.DESCRIPTION,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # Setup middleware
    setup_middleware(app)

    # Setup security
    setup_security(app)

    # Setup event handlers
    setup_events(app)

    # Include API routes
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
'''

    main_file = Path(base_dir) / project_name / "app" / "main.py"
    with open(main_file, 'w') as f:
        f.write(main_content)

    return "app/main.py created"


def create_config_file(base_dir: str, project_name: str) -> str:
    """Create the configuration file."""

    config_content = '''from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # Project information
    PROJECT_NAME: str = "FastAPI Project"
    DESCRIPTION: str = "A FastAPI project with best practices"
    VERSION: str = "1.0.0"
    PORT: int = 8000

    # API configuration
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fastapi.db")
    DATABASE_ECHO: bool = os.getenv("DATABASE_ECHO", "false").lower() == "true"

    # Security configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8080",
    ]

    # Redis configuration (for caching, rate limiting)
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))

    class Config:
        env_file = ".env"


settings = Settings()
'''

    config_file = Path(base_dir) / project_name / "app" / "core" / "config.py"
    with open(config_file, 'w') as f:
        f.write(config_content)

    return "app/core/config.py created"


def create_middleware_file(base_dir: str, project_name: str) -> str:
    """Create the middleware configuration file."""

    middleware_content = '''from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.core.config import settings


def setup_middleware(app: FastAPI) -> None:
    """Configure application middleware."""

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add other middleware as needed
    # app.add_middleware(SecurityHeadersMiddleware)
    # app.add_middleware(RateLimitMiddleware)
    # app.add_middleware(LoggingMiddleware)
'''

    middleware_file = Path(base_dir) / project_name / "app" / "core" / "middleware.py"
    with open(middleware_file, 'w') as f:
        f.write(middleware_content)

    return "app/core/middleware.py created"


def create_events_file(base_dir: str, project_name: str) -> str:
    """Create the events configuration file."""

    events_content = '''from fastapi import FastAPI
from app.database.session import engine
from app.database.base import Base


def setup_events(app: FastAPI) -> None:
    """Configure application startup and shutdown events."""

    @app.on_event("startup")
    async def startup_event():
        """Startup event handler."""
        print("Starting up...")
        # Create database tables
        Base.metadata.create_all(bind=engine)

    @app.on_event("shutdown")
    async def shutdown_event():
        """Shutdown event handler."""
        print("Shutting down...")
'''

    events_file = Path(base_dir) / project_name / "app" / "core" / "events.py"
    with open(events_file, 'w') as f:
        f.write(events_content)

    return "app/core/events.py created"


def create_security_file(base_dir: str, project_name: str) -> str:
    """Create the security configuration file."""

    security_content = '''from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


def setup_security(app: FastAPI) -> None:
    """Setup security configurations."""

    # Setup rate limiting
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter

    # Add rate limit exceeded handler
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Add security schemes to OpenAPI docs
    # app.openapi_tags.append({
    #     "name": "security",
    #     "description": "Security-related endpoints"
    # })
'''

    security_file = Path(base_dir) / project_name / "app" / "core" / "security.py"
    with open(security_file, 'w') as f:
        f.write(security_content)

    return "app/core/security.py created"


def create_api_router_file(base_dir: str, project_name: str) -> str:
    """Create the main API router file."""

    api_content = '''from fastapi import APIRouter

from app.api.v1 import auth, users

api_router = APIRouter()

# Include all API routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, tags=["users"])

# Health check endpoint
@api_router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "detail": "API is running"}
'''

    api_file = Path(base_dir) / project_name / "app" / "api" / "v1" / "api.py"
    with open(api_file, 'w') as f:
        f.write(api_content)

    return "app/api/v1/api.py created"


def create_auth_router_file(base_dir: str, project_name: str) -> str:
    """Create the auth router file."""

    auth_content = '''from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.schemas.auth import Token, UserCreate
from app.services.auth_service import AuthService
from app.api.deps import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token login, get an access token for future requests."""
    user = AuthService.authenticate_user(
        db, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=30)
    access_token = AuthService.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=User)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    user = AuthService.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = AuthService.create_user(db, user_in=user_in)
    return user


@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user."""
    return current_user
'''

    auth_file = Path(base_dir) / project_name / "app" / "api" / "v1" / "auth.py"
    with open(auth_file, 'w') as f:
        f.write(auth_content)

    return "app/api/v1/auth.py created"


def create_users_router_file(base_dir: str, project_name: str) -> str:
    """Create the users router file."""

    users_content = '''from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user_service import UserService
from app.api.deps import get_db, get_current_active_user
from app.models.user import User as UserModel

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[User])
def list_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List users with pagination."""
    users = UserService.get_users(db, skip=skip, limit=limit)
    return users


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Create a new user (admin only)."""
    # Check if current user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )

    user = UserService.create_user(db, user_in=user_in)
    return user


@router.get("/{user_id}", response_model=User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get a specific user."""
    user = UserService.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check permissions
    if user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Update a user."""
    user = UserService.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check permissions
    if user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user = UserService.update_user(db, user_id=user_id, user_in=user_in)
    return user
'''

    users_file = Path(base_dir) / project_name / "app" / "api" / "v1" / "users.py"
    with open(users_file, 'w') as f:
        f.write(users_content)

    return "app/api/v1/users.py created"


def create_deps_file(base_dir: str, project_name: str) -> str:
    """Create the dependencies file."""

    deps_content = '''from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.user import User
from app.schemas.auth import TokenData
from app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Dependency to get current user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = AuthService.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user
'''

    deps_file = Path(base_dir) / project_name / "app" / "api" / "deps.py"
    with open(deps_file, 'w') as f:
        f.write(deps_content)

    return "app/api/deps.py created"


def create_database_files(base_dir: str, project_name: str) -> str:
    """Create database-related files."""

    # Create base.py
    base_content = '''from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer

Base = declarative_base()


class TimestampMixin:
    """Mixin class to add created_at and updated_at timestamps."""

    created_at = Column(Integer)
    updated_at = Column(Integer)
'''

    base_file = Path(base_dir) / project_name / "app" / "database" / "base.py"
    with open(base_file, 'w') as f:
        f.write(base_content)

    # Create session.py
    session_content = '''from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=settings.DATABASE_ECHO)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
'''

    session_file = Path(base_dir) / project_name / "app" / "database" / "session.py"
    with open(session_file, 'w') as f:
        f.write(session_content)

    return "Database files created"


def create_requirements_file(base_dir: str, project_name: str) -> str:
    """Create requirements.txt file."""

    requirements_content = '''fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
alembic==1.13.1
asyncpg==0.29.0
redis==5.0.1
slowapi==0.1.9
httpx==0.25.2
celery==5.3.4
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
'''

    requirements_file = Path(base_dir) / project_name / "requirements.txt"
    with open(requirements_file, 'w') as f:
        f.write(requirements_content)

    return "requirements.txt created"


def create_readme_file(base_dir: str, project_name: str) -> str:
    """Create README.md file."""

    readme_content = f'''# {project_name}

This is a FastAPI application generated with best practices and proper architecture.

## Features

- FastAPI framework with async support
- Proper directory structure following best practices
- Dependency injection patterns
- Authentication and authorization
- Database integration with SQLAlchemy
- API versioning
- Security best practices
- Testing setup

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## Project Structure

```
{project_name}/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Application factory
│   ├── core/                   # Core configurations
│   │   ├── __init__.py
│   │   ├── config.py           # Settings
│   │   ├── middleware.py       # Middleware configuration
│   │   ├── events.py           # Startup/shutdown events
│   │   └── security.py         # Security configurations
│   ├── api/                    # API endpoints
│   │   ├── __init__.py
│   │   └── v1/                 # API version 1
│   │       ├── __init__.py
│   │       ├── api.py          # Main API router
│   │       ├── auth.py         # Authentication endpoints
│   │       └── users.py        # User endpoints
│   ├── models/                 # Pydantic models
│   ├── schemas/                # Request/response schemas
│   ├── database/               # Database operations
│   │   ├── __init__.py
│   │   ├── base.py             # Base model
│   │   └── session.py          # Session management
│   ├── services/               # Business logic
│   └── utils/                  # Utility functions
├── tests/                      # Test files
├── alembic/                    # Database migrations
├── requirements.txt
└── README.md
```

## API Documentation

After starting the server, you can access:
- Interactive API docs at: http://localhost:8000/docs
- Alternative API docs at: http://localhost:8000/redoc
'''

    readme_file = Path(base_dir) / project_name / "README.md"
    with open(readme_file, 'w') as f:
        f.write(readme_content)

    return "README.md created"


def main():
    parser = argparse.ArgumentParser(description='Generate FastAPI architecture')
    parser.add_argument('--project-name', required=True, help='Name of the project')
    parser.add_argument('--output-dir', default='.', help='Output directory (default: current directory)')
    parser.add_argument('--create-model', help='Create a new model with CRUD operations')

    args = parser.parse_args()

    # Create base directory structure
    print(create_directory_structure(args.output_dir, args.project_name))
    print(create_init_files(args.output_dir, args.project_name))

    # Create core application files
    print(create_main_app_file(args.output_dir, args.project_name))
    print(create_config_file(args.output_dir, args.project_name))
    print(create_middleware_file(args.output_dir, args.project_name))
    print(create_events_file(args.output_dir, args.project_name))
    print(create_security_file(args.output_dir, args.project_name))

    # Create API files
    print(create_api_router_file(args.output_dir, args.project_name))
    print(create_auth_router_file(args.output_dir, args.project_name))
    print(create_users_router_file(args.output_dir, args.project_name))
    print(create_deps_file(args.output_dir, args.project_name))

    # Create database files
    print(create_database_files(args.output_dir, args.project_name))

    # Create supporting files
    print(create_requirements_file(args.output_dir, args.project_name))
    print(create_readme_file(args.output_dir, args.project_name))

    print(f"\\nFastAPI architecture for {args.project_name} has been generated successfully!")
    print(f"Directory: {args.output_dir}/{args.project_name}")
    print("\\nTo run the application:")
    print(f"  cd {args.output_dir}/{args.project_name}")
    print("  uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()