# FastAPI Dependency Injection Patterns

## Basic Dependency Injection

### Simple Dependency
Start with basic dependency injection patterns:

```python
# app/api/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Usage in endpoints
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI()


@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user with injected database session."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### Class-Based Dependencies
Use classes for more complex dependencies:

```python
# app/api/deps.py
from typing import Optional
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from pydantic import ValidationError

from app.core.config import settings
from app.models.user import User
from app.schemas.token import TokenData
from app.database.session import SessionLocal
from app.services.user_service import UserService


class CurrentUser:
    """Dependency class to get current user from token."""

    def __init__(self, required: bool = True):
        self.required = required

    def __call__(self, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
            token_data = TokenData(user_id=user_id)
        except (JWTError, ValidationError):
            raise credentials_exception

        user = UserService.get_user_by_id(db, user_id=token_data.user_id)
        if user is None:
            if self.required:
                raise credentials_exception
            return None

        return user


# Usage
current_user = CurrentUser(required=True)
optional_user = CurrentUser(required=False)

@app.get("/users/me")
def read_users_me(current_user: User = Depends(current_user)):
    return current_user


@app.get("/profile")
def read_profile(current_user: User = Depends(optional_user)):
    if current_user:
        return {"profile": current_user.profile, "authenticated": True}
    return {"profile": None, "authenticated": False}
```

## Advanced Dependency Patterns

### Configuration-Based Dependencies
Create dependencies that adapt based on configuration:

```python
# app/api/deps.py
from typing import Literal, Union
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.cache.redis_cache import RedisCache
from app.services.cache.memory_cache import MemoryCache
from app.services.cache.base import BaseCache


def get_cache_service() -> BaseCache:
    """Dependency to get cache service based on configuration."""
    if settings.USE_REDIS_CACHE:
        return RedisCache(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB
        )
    else:
        return MemoryCache(max_size=settings.MEMORY_CACHE_SIZE)


def get_rate_limiter():
    """Dependency to get rate limiter based on configuration."""
    if settings.USE_REDIS_RATE_LIMIT:
        from app.services.rate_limit.redis_limiter import RedisRateLimiter
        return RedisRateLimiter(
            redis_host=settings.REDIS_HOST,
            redis_port=settings.REDIS_PORT
        )
    else:
        from app.services.rate_limit.memory_limiter import MemoryRateLimiter
        return MemoryRateLimiter()
```

### Conditional Dependencies
Create dependencies that behave differently based on conditions:

```python
# app/api/deps.py
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.models.user import User, UserRole


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


def require_role(required_role: UserRole):
    """Factory function to create role-based dependencies."""
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_role.value}"
            )
        return current_user

    return role_checker


def require_any_role(*required_roles: UserRole):
    """Factory function to create dependencies that accept any of the specified roles."""
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in required_roles:
            role_names = [role.value for role in required_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required any of: {', '.join(role_names)}"
            )
        return current_user

    return role_checker


# Usage
admin_required = require_role(UserRole.ADMIN)
user_or_admin_required = require_any_role(UserRole.USER, UserRole.ADMIN)
```

## Service Layer Dependencies

### Repository Pattern with DI
Implement repository pattern with dependency injection:

```python
# app/repositories/base.py
from typing import TypeVar, Generic, List, Optional, Type
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.exceptions import DatabaseError

T = TypeVar('T')


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db_session: Session):
        self.model = model
        self.db = db_session

    def get(self, id: int) -> Optional[T]:
        try:
            return self.db.query(self.model).filter(self.model.id == id).first()
        except SQLAlchemyError as e:
            raise DatabaseError(f"Error retrieving {self.model.__name__}: {str(e)}")

    def get_multi(self, skip: int = 0, limit: int = 100) -> List[T]:
        try:
            return self.db.query(self.model).offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            raise DatabaseError(f"Error retrieving multiple {self.model.__name__}: {str(e)}")

    def create(self, obj: T) -> T:
        try:
            self.db.add(obj)
            self.db.commit()
            self.db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Error creating {self.model.__name__}: {str(e)}")

    def update(self, id: int, obj_data: dict) -> Optional[T]:
        try:
            obj = self.get(id)
            if obj:
                for key, value in obj_data.items():
                    setattr(obj, key, value)
                self.db.commit()
                self.db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Error updating {self.model.__name__}: {str(e)}")

    def delete(self, id: int) -> bool:
        try:
            obj = self.get(id)
            if obj:
                self.db.delete(obj)
                self.db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Error deleting {self.model.__name__}: {str(e)}")


# app/repositories/user_repository.py
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db_session: Session):
        super().__init__(User, db_session)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_active_users(self) -> List[User]:
        return self.db.query(User).filter(User.is_active == True).all()


# app/api/deps.py
def get_user_repository(
    db: Session = Depends(get_db)
) -> UserRepository:
    """Dependency to get user repository."""
    return UserRepository(db_session=db)
```

### Service Layer Dependencies
Create service layer dependencies that use repositories:

```python
# app/services/user_service.py
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.repositories.user_repository import UserRepository
from app.exceptions import NotFoundError, ValidationError


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_user(self, user_id: int) -> Optional[User]:
        return self.user_repo.get(user_id)

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.user_repo.get_multi(skip=skip, limit=limit)

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.user_repo.get_by_email(email)

    def create_user(self, user_in: UserCreate) -> User:
        # Check if user already exists
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise ValidationError("A user with this email already exists")

        # Create user
        user = User(**user_in.dict())
        return self.user_repo.create(user)

    def update_user(self, user_id: int, user_in: UserUpdate) -> Optional[User]:
        user_data = user_in.dict(exclude_unset=True)
        return self.user_repo.update(user_id, user_data)

    def delete_user(self, user_id: int) -> bool:
        return self.user_repo.delete(user_id)


# app/api/deps.py
def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    """Dependency to get user service."""
    return UserService(user_repo=user_repo)
```

## Cross-Cutting Concerns Dependencies

### Logging Dependencies
Create dependencies for logging:

```python
# app/api/deps.py
import logging
from typing import Optional
from fastapi import Request, Depends

from app.core.config import settings


def get_logger(request: Request) -> logging.Logger:
    """Dependency to get logger with request context."""
    logger = logging.getLogger(f"app.{request.scope.get('path', 'unknown')}")

    # Add request ID to logger if available
    request_id = getattr(request.state, 'request_id', None)
    if request_id:
        # Create a custom logger adapter that includes request ID
        class RequestLoggerAdapter(logging.LoggerAdapter):
            def process(self, msg, kwargs):
                return f"[{self.extra['request_id']}] {msg}", kwargs

        logger = RequestLoggerAdapter(logger, {'request_id': request_id})

    return logger


# Usage in endpoints
@app.post("/users/")
def create_user(
    user_in: UserCreate,
    user_service: UserService = Depends(get_user_service),
    logger: logging.Logger = Depends(get_logger)
):
    logger.info(f"Creating user: {user_in.email}")
    user = user_service.create_user(user_in)
    logger.info(f"Created user: {user.id}")
    return user
```

### Metrics Dependencies
Create dependencies for metrics collection:

```python
# app/api/deps.py
from typing import Optional
from fastapi import Request, Depends
from prometheus_client import Counter, Histogram
import time

# Define metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)


def get_metrics_collector(request: Request):
    """Dependency to get metrics collector."""
    class MetricsCollector:
        def __init__(self, request: Request):
            self.request = request
            self.start_time = time.time()

        def record_request(self, status_code: int):
            REQUEST_COUNT.labels(
                method=self.request.method,
                endpoint=self.request.url.path,
                status=status_code
            ).inc()

            duration = time.time() - self.start_time
            REQUEST_DURATION.labels(
                method=self.request.method,
                endpoint=self.request.url.path
            ).observe(duration)

    return MetricsCollector(request)


# Usage with middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    metrics_collector = get_metrics_collector(request)
    response = await call_next(request)
    metrics_collector.record_request(response.status_code)
    return response
```

## Configuration Dependencies

### Settings Dependencies
Create dependencies for different configuration needs:

```python
# app/api/deps.py
from app.core.config import settings


def get_settings():
    """Dependency to get application settings."""
    return settings


def get_database_url():
    """Dependency to get database URL."""
    return settings.DATABASE_URL


def get_api_prefix():
    """Dependency to get API prefix."""
    return settings.API_V1_STR


def require_debug_mode():
    """Dependency to check if application is in debug mode."""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in debug mode"
        )


# Usage
@app.get("/debug/info")
def debug_info(settings=Depends(require_debug_mode)):
    return {
        "debug": settings.DEBUG,
        "database_url": settings.DATABASE_URL,
        "version": settings.VERSION
    }
```

## Testing Dependencies

### Mock Dependencies for Testing
Create dependencies that can be easily mocked for testing:

```python
# app/api/deps.py
from typing import Protocol, Optional
from unittest.mock import MagicMock

from app.services.email_service import EmailService
from app.services.notification_service import NotificationService


class EmailServiceProtocol(Protocol):
    def send_email(self, to: str, subject: str, body: str) -> bool:
        ...


def get_email_service() -> EmailServiceProtocol:
    """Dependency to get email service."""
    return EmailService()


def get_test_email_service() -> EmailServiceProtocol:
    """Mock dependency for testing."""
    mock = MagicMock(spec=EmailServiceProtocol)
    mock.send_email.return_value = True
    return mock


# In tests
def override_get_email_service():
    return get_test_email_service()


# app/main.py
app.dependency_overrides[get_email_service] = override_get_email_service
```

These dependency injection patterns provide a flexible and maintainable way to manage dependencies in your FastAPI application, supporting everything from basic database connections to complex service layer interactions and cross-cutting concerns.