# REST API Design Security Best Practices

## Authentication and Authorization Security

### Secure Authentication Implementation
```python
# ✅ Secure: Implement proper authentication
# app/auth/security.py
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Securely verify password using bcrypt"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create secure JWT token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire, "sub": str(data.get("sub"))})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Securely verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={"verify_exp": True}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id: int = int(payload.get("sub"))

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    user = crud.user.get(db, id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
```

### Role-Based Access Control (RBAC)
```python
# ✅ Secure: Implement role-based access control
# app/auth/rbac.py
from enum import Enum
from typing import List
from fastapi import HTTPException, status

class UserRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

class Permission(str, Enum):
    READ_USERS = "read:users"
    WRITE_USERS = "write:users"
    DELETE_USERS = "delete:users"
    READ_ORDERS = "read:orders"
    WRITE_ORDERS = "write:orders"

# Role permissions mapping
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [p.value for p in Permission],
    UserRole.MODERATOR: [
        Permission.READ_USERS, Permission.WRITE_USERS,
        Permission.READ_ORDERS, Permission.WRITE_ORDERS
    ],
    UserRole.USER: [Permission.READ_USERS],
    UserRole.GUEST: []
}

def check_permission(required_permission: Permission):
    """Dependency to check if user has required permission"""
    async def permission_dependency(current_user = Depends(get_current_user)):
        if current_user.role not in ROLE_PERMISSIONS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role"
            )

        if required_permission.value not in ROLE_PERMISSIONS[current_user.role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )

        return current_user
    return permission_dependency

# Usage in endpoints
@router.get("/users", dependencies=[Depends(check_permission(Permission.READ_USERS))])
def read_users():
    """Only users with read:users permission can access"""
    pass

@router.delete("/users/{user_id}", dependencies=[Depends(check_permission(Permission.DELETE_USERS))])
def delete_user():
    """Only users with delete:users permission can access"""
    pass
```

## Input Validation and Sanitization

### Request Data Validation
```python
# ✅ Secure: Validate and sanitize all input data
# app/schemas/user.py
from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class UserCreate(BaseModel):
    email: str = Field(..., regex=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(..., min_length=12, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, regex=r'^\+?1?[0-9]{9,15}$')

    @validator('email')
    def validate_email(cls, v):
        """Validate email format and normalize"""
        if not v:
            raise ValueError('Email is required')

        # Normalize email
        normalized = v.lower().strip()

        # Validate length
        if len(normalized) > 254:
            raise ValueError('Email is too long')

        return normalized

    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password strength"""
        errors = []

        if len(v) < 12:
            errors.append("Password must be at least 12 characters")

        if not re.search(r"[A-Z]", v):
            errors.append("Must contain uppercase letter")

        if not re.search(r"[a-z]", v):
            errors.append("Must contain lowercase letter")

        if not re.search(r"\d", v):
            errors.append("Must contain digit")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            errors.append("Must contain special character")

        if errors:
            raise ValueError("; ".join(errors))

        return v

    @validator('name')
    def validate_name(cls, v):
        """Validate name and sanitize"""
        if not v or len(v.strip()) < 1:
            raise ValueError('Name is required')

        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>"\']', '', v).strip()

        if len(sanitized) > 100:
            raise ValueError('Name is too long')

        return sanitized
```

### Query Parameter Validation
```python
# ✅ Secure: Validate and sanitize query parameters
# app/schemas/queries.py
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from enum import Enum

class SortDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"

class BaseQueryParams(BaseModel):
    page: int = Field(1, ge=1, le=10000)
    limit: int = Field(10, ge=1, le=100)
    sort: Optional[str] = Field(None, regex=r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    order: SortDirection = SortDirection.ASC
    search: Optional[str] = Field(None, max_length=100)

    @validator('search')
    def validate_search(cls, v):
        """Sanitize search parameter"""
        if v:
            # Remove potentially harmful characters
            sanitized = re.sub(r'[<>"\';]', '', v).strip()
            return sanitized
        return v

class UserQueryParams(BaseQueryParams):
    status: Optional[str] = Field(None, regex=r'^[a-zA-Z_][a-zA-Z0-9_]*$')
    role: Optional[str] = Field(None, regex=r'^[a-zA-Z_][a-zA-Z0-9_]*$')

    @validator('status', 'role')
    def validate_enum_field(cls, v):
        """Validate that field values are in allowed list"""
        if v:
            # Define allowed values
            allowed_values = {
                'status': ['active', 'inactive', 'pending', 'suspended'],
                'role': ['admin', 'user', 'moderator', 'guest']
            }

            field_name = 'status' if 'status' in cls.__fields__ else 'role'
            if v not in allowed_values.get(field_name, []):
                raise ValueError(f'Invalid {field_name}: {v}')

        return v
```

## Rate Limiting and DoS Protection

### API Rate Limiting
```python
# ✅ Secure: Implement rate limiting
# app/middleware/rate_limit.py
import time
import redis
from fastapi import Request, HTTPException, status
from typing import Dict
from app.config import settings

class RateLimiter:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.redis_url)
        self.default_limits = {
            'requests': 100,
            'window': 60  # 100 requests per 60 seconds
        }

    def is_allowed(self, identifier: str, limit: int = None, window: int = None) -> bool:
        """Check if request is allowed based on rate limit"""
        limit = limit or self.default_limits['requests']
        window = window or self.default_limits['window']

        current_time = int(time.time())
        window_start = current_time - window

        # Use Redis sorted set to track requests
        key = f"rate_limit:{identifier}"

        # Remove old requests outside the window
        self.redis_client.zremrangebyscore(key, 0, window_start)

        # Get current count
        current_count = self.redis_client.zcard(key)

        if current_count >= limit:
            return False

        # Add current request
        self.redis_client.zadd(key, {str(current_time): current_time})
        self.redis_client.expire(key, window)

        return True

# Global rate limiter
rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    # Create identifier from client IP and endpoint
    client_ip = request.client.host
    endpoint = request.url.path

    # Different limits for different endpoints
    if endpoint.startswith('/auth'):
        limit = 10  # Lower limit for auth endpoints
        window = 60
    elif endpoint.startswith('/users'):
        limit = 100  # Normal limit for user endpoints
        window = 60
    else:
        limit = 1000  # Higher limit for other endpoints
        window = 60

    identifier = f"{client_ip}:{endpoint}"

    if not rate_limiter.is_allowed(identifier, limit, window):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    response = await call_next(request)
    return response
```

### Rate Limiting with Sliding Window
```python
# ✅ Secure: Sliding window rate limiting
class SlidingWindowRateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client

    def is_allowed_sliding_window(
        self,
        identifier: str,
        limit: int,
        window: int
    ) -> bool:
        """
        Sliding window rate limiting using Redis
        """
        current_time = time.time()
        pipeline = self.redis.pipeline()

        # Remove requests older than window
        pipeline.zremrangebyscore(identifier, 0, current_time - window)

        # Count current requests
        pipeline.zcard(identifier)

        # Add current request
        pipeline.zadd(identifier, {str(current_time): current_time})

        # Set expiration
        pipeline.expire(identifier, window)

        results = pipeline.execute()
        current_count = results[1]

        return current_count < limit
```

## SQL Injection Prevention

### Safe Database Queries
```python
# ✅ Secure: Use parameterized queries to prevent SQL injection
# app/crud/user.py
from sqlmodel import Session, select
from typing import List, Optional
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get_users_safe(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None
) -> List[User]:
    """Get users with safe parameterized queries"""
    statement = select(User)

    # Safely add filters
    if search:
        # Use SQLModel's built-in escaping
        statement = statement.where(User.name.contains(search))

    if status:
        statement = statement.where(User.status == status)

    # Safely apply pagination
    statement = statement.offset(skip).limit(limit)

    return db.exec(statement).all()

def get_user_by_email_safe(db: Session, email: str) -> Optional[User]:
    """Get user by email using parameterized query"""
    # ✅ Safe: Parameterized query prevents injection
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()

def search_users_safe(db: Session, search_term: str) -> List[User]:
    """Search users with sanitized input"""
    # Sanitize search term to prevent injection
    sanitized_search = search_term.replace('%', '\\%').replace('_', '\\_')

    statement = select(User).where(
        User.email.contains(sanitized_search) |
        User.name.contains(sanitized_search)
    )
    return db.exec(statement).all()
```

## Cross-Site Request Forgery (CSRF) Protection

### CSRF Token Implementation
```python
# ✅ Secure: Implement CSRF protection
# app/middleware/csrf.py
import secrets
import hashlib
from fastapi import Request, HTTPException, status
from typing import Set

class CSRFProtection:
    def __init__(self):
        self.tokens: Set[str] = set()

    def generate_token(self) -> str:
        """Generate secure CSRF token"""
        token = secrets.token_urlsafe(32)
        self.tokens.add(token)
        return token

    def validate_token(self, token: str, request: Request) -> bool:
        """Validate CSRF token"""
        if token not in self.tokens:
            return False

        # Additional validation: check origin/referrer
        origin = request.headers.get('Origin')
        referer = request.headers.get('Referer')

        # For security, validate that requests come from allowed origins
        if origin and not self.is_allowed_origin(origin):
            return False

        if referer and not self.is_allowed_origin(referer):
            return False

        # Remove token after use (one-time use)
        self.tokens.remove(token)
        return True

    def is_allowed_origin(self, origin: str) -> bool:
        """Check if origin is allowed"""
        # In production, use settings.allowed_origins
        allowed_origins = [
            'https://yourdomain.com',
            'https://www.yourdomain.com'
        ]
        return any(allowed in origin for allowed in allowed_origins)

csrf_protection = CSRFProtection()

# Usage in endpoints that modify data
@router.post("/users")
def create_user_csrf_protected(
    user: UserCreate,
    csrf_token: str = Header(...),
    request: Request = None
):
    """Create user with CSRF protection"""
    if not csrf_protection.validate_token(csrf_token, request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed"
        )

    # Process user creation
    return crud.user.create(db, obj_in=user)
```

## Cross-Origin Resource Sharing (CORS) Security

### Secure CORS Configuration
```python
# ✅ Secure: Configure CORS properly
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

def create_app() -> FastAPI:
    app = FastAPI(title="Secure API", debug=settings.debug)

    # Configure CORS based on environment
    if settings.debug:
        # Development: Allow all for testing (but be cautious)
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Only in development
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        # Production: Restrict origins
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
            allow_headers=[
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "X-CSRF-Token"
            ],
            # Security: Don't expose sensitive headers
            expose_headers=["Access-Control-Allow-Origin"],
            max_age=86400,  # Cache CORS preflight for 24 hours
        )

    return app
```

## Security Headers Implementation

### HTTP Security Headers
```python
# ✅ Secure: Configure security headers
# app/middleware/security.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import secrets

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Content Security Policy
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "base-uri 'self';"
        )

        # HTTP Strict Transport Security
        response.headers.setdefault(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        )

        # X-Content-Type-Options
        response.headers.setdefault("X-Content-Type-Options", "nosniff")

        # X-Frame-Options
        response.headers.setdefault("X-Frame-Options", "DENY")

        # X-XSS-Protection
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")

        # Referrer Policy
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")

        # Permissions Policy
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()"
        )

        # Cache control for sensitive data
        if request.url.path.startswith('/api/') and request.method in ['GET', 'POST']:
            response.headers.setdefault("Cache-Control", "no-store, no-cache")

        return response

def configure_security_middlewares(app):
    """Configure all security middlewares"""
    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)
```

## Error Handling Security

### Secure Error Responses
```python
# ✅ Secure: Handle errors without exposing sensitive information
# app/exception_handlers.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.utils.logging import log_security_event
import traceback
import secrets

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions securely"""
    # Log security event
    error_id = secrets.token_hex(8)
    log_security_event(
        event_type="HTTP_EXCEPTION",
        ip_address=request.client.host,
        details={
            "error_id": error_id,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )

    # Return generic error message to client
    if exc.status_code >= 500:
        # For server errors, don't expose internal details
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An internal server error occurred",
                    "error_id": error_id
                }
            }
        )
    else:
        # For client errors, can be more specific
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "CLIENT_ERROR",
                    "message": exc.detail if isinstance(exc.detail, str) else "Bad request"
                }
            }
        )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions securely"""
    # Log detailed error for internal debugging
    error_id = secrets.token_hex(8)
    print(f"ERROR {error_id}: {str(exc)}\n{traceback.format_exc()}")

    # Log security event
    log_security_event(
        event_type="GENERAL_EXCEPTION",
        ip_address=request.client.host,
        details={
            "error_id": error_id,
            "error_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method
        }
    )

    # Return generic error message to client
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal server error occurred",
                "error_id": error_id
            }
        }
    )

def register_error_handlers(app):
    """Register secure error handlers"""
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
```

## Data Protection and Privacy

### Sensitive Data Handling
```python
# ✅ Secure: Handle sensitive data properly
# app/models/user.py
from sqlmodel import Field, SQLModel
from pydantic import computed_field
from typing import Optional
import re

class UserBase(SQLModel):
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    phone: Optional[str] = Field(None, description="User phone number")

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(..., description="BCrypt hashed password")
    is_active: bool = Field(True, description="User account status")

    # Don't expose sensitive fields in responses
    @computed_field
    @property
    def masked_email(self) -> str:
        """Return masked email address"""
        if '@' in self.email:
            local, domain = self.email.split('@', 1)
            if len(local) > 2:
                masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
            else:
                masked_local = '*' * len(local)
            return f"{masked_local}@{domain}"
        return self.email

    @computed_field
    @property
    def masked_phone(self) -> Optional[str]:
        """Return masked phone number"""
        if self.phone:
            # Mask phone number: show only last 2 digits
            digits_only = re.sub(r'\D', '', self.phone)
            if len(digits_only) >= 4:
                masked = '*' * (len(digits_only) - 2) + digits_only[-2:]
                # Restore original formatting
                result = masked
                original_parts = re.findall(r'\D', self.phone)
                for i, sep in enumerate(original_parts):
                    pos = min(i + 1, len(result))
                    if pos < len(result):
                        result = result[:pos] + sep + result[pos:]
                return result
        return self.phone

# Response model without sensitive data
class UserResponse(UserBase):
    id: int
    masked_email: str
    masked_phone: Optional[str] = None

    class Config:
        # Exclude sensitive fields from serialization
        fields = {
            'hashed_password': {'exclude': True}
        }
```

### Data Encryption
```python
# ✅ Secure: Encrypt sensitive data
# app/security/encryption.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from typing import Union

class DataEncryption:
    def __init__(self):
        self.key = self._derive_key(os.getenv('ENCRYPTION_PASSWORD'))

    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key from password"""
        if not password:
            raise ValueError("Encryption password is required")

        salt = b'salt_'  # In production, use a random salt per record
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def encrypt(self, data: Union[str, bytes]) -> str:
        """Encrypt data"""
        f = Fernet(self.key)
        if isinstance(data, str):
            data = data.encode()
        encrypted_data = f.encrypt(data)
        return base64.urlsafe_b64encode(encrypted_data).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt data"""
        f = Fernet(self.key)
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = f.decrypt(encrypted_bytes)
        return decrypted_data.decode()

# Global encryption instance
data_encryptor = DataEncryption()

# Usage in models
class UserSensitiveData:
    def __init__(self, ssn: str, credit_card: str):
        self.encrypted_ssn = data_encryptor.encrypt(ssn)
        self.encrypted_credit_card = data_encryptor.encrypt(credit_card)

    def get_ssn(self) -> str:
        return data_encryptor.decrypt(self.encrypted_ssn)
```

## Logging and Monitoring Security

### Secure Logging
```python
# ✅ Secure: Log security events without exposing sensitive data
# app/utils/security_logging.py
import logging
import json
from datetime import datetime
from typing import Dict, Any

# Configure secure logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

class SecureFormatter(logging.Formatter):
    def format(self, record):
        # Sanitize sensitive data from log records
        msg = record.msg
        if isinstance(msg, dict):
            sanitized_msg = self.sanitize_log_data(msg)
            record.msg = json.dumps(sanitized_msg)

        return super().format(record)

    def sanitize_log_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from log data"""
        sanitized = {}

        for key, value in data.items():
            if isinstance(key, str) and any(
                s in key.lower() for s in ['password', 'token', 'key', 'secret', 'auth', 'credential', 'ssn', 'card']
            ):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, str) and any(
                s in key.lower() for s in ['password', 'token', 'key', 'secret', 'auth', 'credential', 'ssn', 'card']
            ):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_log_data(value)
            else:
                sanitized[key] = value

        return sanitized

def log_security_event(event_type: str, user_id: str = None, ip_address: str = None, details: Dict = None):
    """Log security-related events"""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        "details": details or {}
    }

    security_logger.info(log_data)

# Usage examples
def log_login_attempt(username: str, success: bool, ip_address: str):
    """Log login attempt"""
    event_type = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
    log_security_event(
        event_type=event_type,
        details={"username": username, "success": success},
        ip_address=ip_address
    )

def log_api_access(user_id: str, endpoint: str, ip_address: str):
    """Log API access"""
    log_security_event(
        event_type="API_ACCESS",
        user_id=user_id,
        details={"endpoint": endpoint},
        ip_address=ip_address
    )
```

## Dependency Security

### Secure Dependency Management
```python
# ✅ Secure: Manage dependencies securely
# requirements.txt (examples of secure versions)
fastapi>=0.104.1
uvicorn>=0.24.0
sqlmodel>=0.0.8
pydantic>=2.5.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
cryptography>=41.0.7
email-validator>=2.0.0
python-multipart>=0.0.6
redis>=5.0.1
cryptography>=41.0.7

# Security scanning configuration
# .github/workflows/security-scan.yml
"""
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly security scan

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install safety
          pip install pip-audit

      - name: Run Safety check
        run: |
          safety check --full-report

      - name: Run pip-audit
        run: |
          pip-audit
"""
```

## API Security Testing

### Automated Security Tests
```python
# tests/test_api_security.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_authentication_required():
    """Test that authentication is required for protected endpoints"""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401  # Unauthorized

def test_authorization_levels():
    """Test different authorization levels"""
    # Test with user token accessing admin endpoint
    headers = {"Authorization": "Bearer user_token"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403  # Forbidden

def test_rate_limiting():
    """Test rate limiting functionality"""
    # Make multiple requests
    for i in range(105):  # More than rate limit
        response = client.get("/api/v1/users")
        if i >= 100:  # Should start returning 429 after rate limit
            if response.status_code == 429:
                break
    else:
        pytest.fail("Rate limiting not working")

def test_sql_injection_protection():
    """Test protection against SQL injection"""
    malicious_payloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin';--",
        "'; EXEC xp_cmdshell 'dir';--"
    ]

    for payload in malicious_payloads:
        response = client.get(f"/api/v1/users?search={payload}")
        # Should not return 500 (internal server error) for malicious input
        assert response.status_code != 500

def test_input_validation():
    """Test input validation"""
    # Test with invalid email
    response = client.post("/api/v1/users", json={
        "email": "invalid-email",
        "name": "Test User",
        "password": "weak"
    })
    assert response.status_code == 422  # Validation error

def test_security_headers():
    """Test that security headers are present"""
    response = client.get("/api/v1/users")

    # Check for security headers
    assert "X-Content-Type-Options" in response.headers
    assert "X-Frame-Options" in response.headers
    assert "X-XSS-Protection" in response.headers

def test_cors_security():
    """Test CORS security configuration"""
    # Test preflight request
    response = client.options(
        "/api/v1/users",
        headers={
            "Origin": "https://malicious-site.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "X-Requested-With"
        }
    )

    # Should not allow malicious origins
    assert "Access-Control-Allow-Origin" not in response.headers or \
           response.headers.get("Access-Control-Allow-Origin") != "https://malicious-site.com"
```

## Security Checklist

### API Security Implementation Checklist
```markdown
# REST API Security Checklist

## Before deploying to production:

### Authentication & Authorization
- [ ] JWT tokens properly implemented with secure signing
- [ ] Passwords hashed using bcrypt or similar
- [ ] Authentication required for all sensitive endpoints
- [ ] Role-based access control implemented
- [ ] Permission checks in place for all operations
- [ ] Session management secure with proper timeouts

### Input Validation
- [ ] All user inputs validated and sanitized
- [ ] Pydantic models used for request validation
- [ ] SQL injection prevention implemented (parameterized queries)
- [ ] File upload validation implemented
- [ ] Rate limiting configured
- [ ] Query parameter validation implemented

### Configuration Security
- [ ] Secrets stored in environment variables only
- [ ] No hardcoded credentials in source code
- [ ] Configuration validation implemented
- [ ] Debug mode disabled in production
- [ ] CORS configured properly for production

### Data Protection
- [ ] Sensitive data not exposed in responses
- [ ] Personal data properly masked when necessary
- [ ] Database connections encrypted
- [ ] SSL/TLS enforced for all communications
- [ ] Audit logging implemented

### Error Handling
- [ ] No sensitive information in error messages
- [ ] Proper exception handling implemented
- [ ] Security events logged appropriately
- [ ] Error responses don't leak system information

### Headers & Security
- [ ] Security headers properly configured
- [ ] Content Security Policy implemented
- [ ] X-Frame-Options set to DENY
- [ ] HSTS enabled
- [ ] X-XSS-Protection enabled

### Dependencies
- [ ] Dependencies scanned for vulnerabilities
- [ ] Outdated packages updated
- [ ] Only trusted sources used
- [ ] Dependency versions pinned appropriately
- [ ] Security patches applied

### Testing
- [ ] Security tests implemented and passing
- [ ] Penetration testing performed
- [ ] Vulnerability scanning completed
- [ ] Error handling tested
- [ ] Authentication flows tested
```

These security practices ensure that your REST API design remains secure throughout its lifecycle while maintaining the benefits of RESTful architecture and proper API design principles.