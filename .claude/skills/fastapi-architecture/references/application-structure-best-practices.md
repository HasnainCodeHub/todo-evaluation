# FastAPI Application Structure Best Practices

## Application Factory Pattern

### Core Application Factory
The application factory pattern is the recommended approach for creating FastAPI applications. This pattern allows for better configuration management, testing, and flexibility.

```python
# app/main.py
from fastapi import FastAPI
from app.core.config import settings
from app.api.deps import setup_dependencies
from app.core.middleware import setup_middleware
from app.core.events import setup_events
from app.core.security import setup_security


def create_app() -> FastAPI:
    """Factory function to create FastAPI application."""
    # Create FastAPI instance with settings
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

    # Setup dependencies
    setup_dependencies(app)

    # Include API routes
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_app()
```

### Configuration Management
Proper configuration management is crucial for maintainable FastAPI applications:

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Project information
    PROJECT_NAME: str = "FastAPI Project"
    DESCRIPTION: str = "A FastAPI project"
    VERSION: str = "1.0.0"

    # API configuration
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    DATABASE_ECHO: bool = os.getenv("DATABASE_ECHO", "false").lower() == "true"

    # Security configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS configuration
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8080",
    ]

    # Redis configuration (for caching, rate limiting)
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))

    # Email configuration
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")


settings = Settings()
```

## Directory Structure Patterns

### Feature-Based Organization
Organize your application by features rather than technical layers:

```
app/
├── __init__.py
├── main.py                 # Application factory
├── core/                   # Core functionality
│   ├── __init__.py
│   ├── config.py           # Configuration settings
│   ├── security.py         # Security utilities
│   ├── middleware.py       # Middleware definitions
│   ├── events.py           # Startup/shutdown events
│   └── exceptions.py       # Custom exceptions
├── api/                    # API layer
│   ├── __init__.py
│   ├── deps.py             # Dependency injection
│   ├── v1/                 # API version 1
│   │   ├── __init__.py
│   │   ├── api.py          # Main API router
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── users.py        # User endpoints
│   │   └── tasks.py        # Task endpoints
│   └── v2/                 # API version 2 (future)
├── models/                 # Pydantic models
│   ├── __init__.py
│   ├── user.py             # User models
│   ├── task.py             # Task models
│   └── auth.py             # Authentication models
├── schemas/                # Request/response schemas
│   ├── __init__.py
│   ├── user.py
│   ├── task.py
│   └── auth.py
├── database/               # Database operations
│   ├── __init__.py
│   ├── session.py          # Session management
│   ├── base.py             # Base model
│   └── models/             # SQL models
│       ├── __init__.py
│       ├── user.py
│       └── task.py
├── services/               # Business logic
│   ├── __init__.py
│   ├── user_service.py
│   ├── task_service.py
│   └── auth_service.py
├── utils/                  # Utility functions
│   ├── __init__.py
│   ├── security.py
│   ├── validators.py
│   └── helpers.py
└── exceptions/             # Custom exceptions
    ├── __init__.py
    └── http_exceptions.py
```

### Domain-Driven Design Structure
For larger applications, consider a domain-driven approach:

```
app/
├── domains/                # Domain modules
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api.py
│   │   ├── services.py
│   │   └── dependencies.py
│   ├── users/
│   │   ├── __init__.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api.py
│   │   ├── services.py
│   │   └── dependencies.py
│   └── tasks/
│       ├── __init__.py
│       ├── models/
│       ├── schemas/
│       ├── api.py
│       ├── services.py
│       └── dependencies.py
├── core/
├── shared/
└── main.py
```

## Router Organization Strategies

### Modular Router Pattern
Create modular routers that can be easily composed:

```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user_service import UserService
from app.api.deps import get_db, get_current_active_user

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
    db: Session = Depends(get_db)
):
    """Create a new user."""
    user = UserService.create_user(db, user_in=user_in)
    return user


@router.get("/{user_id}", response_model=User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific user."""
    user = UserService.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Update a user."""
    user = UserService.update_user(
        db,
        user_id=user_id,
        user_in=user_in
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Delete a user."""
    success = UserService.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return
```

### API Router Assembly
Consolidate all routers in a central location:

```python
# app/api/v1/api.py
from fastapi import APIRouter

from app.api.v1 import auth, users, tasks

api_router = APIRouter()

# Include all API routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router)
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

# Health check endpoint
@api_router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "detail": "API is running"}
```

## Dependency Injection Patterns

### Database Session Management
Proper dependency injection for database sessions:

```python
# app/api/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import verify_token
from app.services.auth_service import AuthService


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(verify_token)
) -> User:
    """Dependency to get current user from token."""
    user = AuthService.get_user_by_id(db, user_id=token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get current active superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user doesn't have enough privileges"
        )
    return current_user
```

### Service Layer Dependencies
Inject services with proper configuration:

```python
# app/api/deps.py (continued)
from app.services.user_service import UserService
from app.services.task_service import TaskService


def get_user_service(
    db: Session = Depends(get_db)
) -> UserService:
    """Dependency to get user service."""
    return UserService(db)


def get_task_service(
    db: Session = Depends(get_db)
) -> TaskService:
    """Dependency to get task service."""
    return TaskService(db)
```

## Error Handling Strategy

### Custom HTTP Exceptions
Define custom HTTP exceptions for better error handling:

```python
# app/exceptions/http_exceptions.py
from fastapi import HTTPException, status


class HTTPException400(HTTPException):
    def __init__(self, detail: str = "Bad Request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class HTTPException401(HTTPException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class HTTPException403(HTTPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class HTTPException404(HTTPException):
    def __init__(self, detail: str = "Not Found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class HTTPException409(HTTPException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class HTTPException422(HTTPException):
    def __init__(self, detail: str = "Unprocessable Entity"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class HTTPException500(HTTPException):
    def __init__(self, detail: str = "Internal Server Error"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
```

### Exception Handlers
Register custom exception handlers:

```python
# app/core/exceptions.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Dict, Any

from app.schemas.responses import ErrorResponse


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            error=exc.detail,
            error_code=f"HTTP_{exc.status_code}"
        ).dict()
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation exceptions."""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            success=False,
            error="Validation error",
            error_code="VALIDATION_ERROR",
            details={"errors": exc.errors()}
        ).dict()
    )


def setup_exception_handlers(app):
    """Register exception handlers with the application."""
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
```

Following these application structure best practices will result in a well-organized, maintainable, and scalable FastAPI application.