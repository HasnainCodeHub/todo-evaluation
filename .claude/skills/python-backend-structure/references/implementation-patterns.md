# Python Backend Structure Implementation Patterns

## Project Setup Patterns

### Poetry-based Project Structure
```toml
# pyproject.toml
[tool.poetry]
name = "my-fastapi-app"
version = "0.1.0"
description = "FastAPI backend application"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
sqlmodel = "^0.0.8"
pydantic = "^2.4.0"
python-jose = "^3.3.0"
passlib = "^1.7.4"
python-multipart = "^0.0.6"
redis = "^5.0.0"
celery = "^5.3.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.0"
pytest-cov = "^4.1.0"
black = "^23.7.0"
flake8 = "^6.0.0"
mypy = "^1.5.0"
isort = "^5.12.0"
pre-commit = "^3.4.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.coverage.run]
source = ["app/"]
omit = ["*/tests/*", "*/venv/*", "*/__pycache__/*"]

[tool.coverage.report]
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:"
]
```

### Application Factory Pattern
```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.config import settings
from app.database.session import engine
from app.models.base import SQLModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("Creating tables...")
    SQLModel.metadata.create_all(bind=engine)
    yield
    # Shutdown
    print("Shutting down...")

def create_app() -> FastAPI:
    """Application factory"""
    app = FastAPI(
        title="My API",
        description="FastAPI application",
        version="1.0.0",
        lifespan=lifespan,
        debug=settings.debug
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routers
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    return app

app = create_app()
```

## Layer Implementation Patterns

### Model Layer (SQLModel/SQLAlchemy)
```python
# app/models/user.py
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = True

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    created_at: datetime

class UserUpdate(SQLModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
```

### Schema Layer (Pydantic)
```python
# app/schemas/user.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

class UserInDB(UserBase):
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime
```

### CRUD Layer (Database Operations)
```python
# app/crud/user.py
from typing import List, Optional
from sqlmodel import Session, select
from app.models.user import User, UserCreate, UserUpdate

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    statement = select(User).where(User.id == user_id)
    return db.exec(statement).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    statement = select(User).offset(skip).limit(limit)
    return db.exec(statement).all()

def create_user(db: Session, user: UserCreate) -> User:
    from app.security import get_password_hash

    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    user_data = user_update.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False

    db.delete(db_user)
    db.commit()
    return True
```

### Service Layer (Business Logic)
```python
# app/services/user_service.py
from typing import List, Optional
from sqlmodel import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.crud.user import (
    get_user_by_id, get_user_by_email, get_users,
    create_user, update_user, delete_user
)
from app.exceptions import UserNotFoundException, DuplicateEmailException

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_user(self, user_id: int) -> Optional[User]:
        user = get_user_by_id(self.db, user_id)
        if not user:
            raise UserNotFoundException(f"User with id {user_id} not found")
        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        return get_user_by_email(self.db, email)

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return get_users(self.db, skip, limit)

    def create_user(self, user_create: UserCreate) -> User:
        existing_user = get_user_by_email(self.db, user_create.email)
        if existing_user:
            raise DuplicateEmailException(f"User with email {user_create.email} already exists")

        return create_user(self.db, user_create)

    def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        user = get_user_by_id(self.db, user_id)
        if not user:
            raise UserNotFoundException(f"User with id {user_id} not found")

        # Check for email conflicts
        if user_update.email and user_update.email != user.email:
            existing_user = get_user_by_email(self.db, user_update.email)
            if existing_user and existing_user.id != user_id:
                raise DuplicateEmailException(f"User with email {user_update.email} already exists")

        return update_user(self.db, user_id, user_update)

    def delete_user(self, user_id: int) -> bool:
        user = get_user_by_id(self.db, user_id)
        if not user:
            raise UserNotFoundException(f"User with id {user_id} not found")

        return delete_user(self.db, user_id)
```

### API Layer (FastAPI Routers)
```python
# app/api/v1/endpoints/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        return service.create_user(user)
    except DuplicateEmailException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{user_id}", response_model=UserRead)
def read_user(user_id: int, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        return service.get_user(user_id)
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/", response_model=List[UserRead])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = UserService(db)
    return service.get_users(skip=skip, limit=limit)

@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        return service.update_user(user_id, user_update)
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        success = service.delete_user(user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
```

## Database Layer Patterns

### Database Session Management
```python
# app/database/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

# Create engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """Dependency to provide database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Database Configuration
```python
# app/database/base.py
from sqlmodel import SQLModel
from app.database.session import engine

async def create_tables():
    """Create all tables in database"""
    SQLModel.metadata.create_all(bind=engine)
```

## Authentication and Authorization Patterns

### JWT Authentication
```python
# app/auth/jwt.py
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

from app.config import settings
from app.models.user import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security schemes
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return encoded_jwt

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = security
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    user_id: int = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Here you would fetch the user from database
    # user = get_user_by_id(db, user_id)
    # if user is None:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="User not found",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )
    # return user
```

## Error Handling Patterns

### Custom Exceptions
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

class AuthenticationException(AppException):
    """Raised when authentication fails"""
    pass

class AuthorizationException(AppException):
    """Raised when authorization fails"""
    pass

class ValidationException(AppException):
    """Raised when validation fails"""
    pass
```

### Exception Handlers
```python
# app/exception_handlers.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.exceptions import (
    UserNotFoundException,
    DuplicateEmailException,
    AuthenticationException,
    AuthorizationException,
    ValidationException
)

async def user_not_found_handler(request: Request, exc: UserNotFoundException):
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)}
    )

async def duplicate_email_handler(request: Request, exc: DuplicateEmailException):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

async def validation_exception_handler(request: Request, exc: ValidationException):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )

def register_exception_handlers(app):
    """Register all exception handlers"""
    app.add_exception_handler(UserNotFoundException, user_not_found_handler)
    app.add_exception_handler(DuplicateEmailException, duplicate_email_handler)
    app.add_exception_handler(ValidationException, validation_exception_handler)
```

## Testing Patterns

### Test Structure
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.main import app
from app.database.session import get_db

# Create test database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
SQLModel.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

### Service Layer Testing
```python
# tests/test_services/test_user_service.py
import pytest
from sqlalchemy.orm import Session

from app.services.user_service import UserService
from app.models.user import UserCreate
from app.exceptions import UserNotFoundException, DuplicateEmailException

def test_create_user_success(db_session: Session):
    service = UserService(db_session)

    user_create = UserCreate(
        email="test@example.com",
        password="password123",
        full_name="Test User"
    )

    user = service.create_user(user_create)

    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.id is not None

def test_create_duplicate_email_fails(db_session: Session):
    service = UserService(db_session)

    # Create first user
    user_create = UserCreate(
        email="test@example.com",
        password="password123",
        full_name="Test User"
    )
    service.create_user(user_create)

    # Try to create user with same email
    duplicate_create = UserCreate(
        email="test@example.com",
        password="password456",
        full_name="Another User"
    )

    with pytest.raises(DuplicateEmailException):
        service.create_user(duplicate_create)

def test_get_user_not_found(db_session: Session):
    service = UserService(db_session)

    with pytest.raises(UserNotFoundException):
        service.get_user(999)
```

These implementation patterns provide a comprehensive guide for structuring Python backend code following best practices for maintainability, testability, and scalability.