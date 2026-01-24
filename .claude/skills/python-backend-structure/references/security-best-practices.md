# Python Backend Structure Security Best Practices

## Configuration Security

### Environment Variable Management
```python
# ✅ Secure: Use environment variables for configuration
# app/config.py
import os
from pydantic import BaseSettings, validator
from typing import List

class Settings(BaseSettings):
    # Database settings
    database_url: str
    database_echo: bool = False

    # API settings
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    # Security settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000"]

    # Rate limiting
    rate_limit_per_minute: int = 60

    @validator('secret_key')
    def secret_key_must_be_secure(cls, v):
        """Validate that secret key is secure"""
        if not v or len(v) < 32:
            raise ValueError('Secret key must be at least 32 characters long')
        return v

    @validator('database_url')
    def database_url_must_be_secure(cls, v):
        """Validate that database URL uses secure connection if in production"""
        if not v:
            raise ValueError('Database URL is required')
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
        # Hide sensitive values from repr
        fields = {
            'secret_key': {'env': 'SECRET_KEY'},
            'database_url': {'env': 'DATABASE_URL'}
        }

settings = Settings()

# ❌ Never: Hardcode secrets in code
# ❌ Never: Commit .env files to version control
```

### Secure Configuration Loading
```python
# ✅ Secure: Validate configuration at startup
def validate_config():
    """Validate configuration at application startup"""
    try:
        # Validate secret key
        if not settings.secret_key or len(settings.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")

        # Validate database URL
        if not settings.database_url:
            raise ValueError("DATABASE_URL is required")

        # Validate allowed origins in production
        if not settings.debug and settings.allowed_origins == ["http://localhost:3000"]:
            raise ValueError("CORS origins should be configured for production")

        print("Configuration validation passed")
        return True

    except ValueError as e:
        print(f"Configuration validation failed: {e}")
        raise

# Call validation in main app
validate_config()
```

## Authentication and Authorization Security

### JWT Token Security
```python
# ✅ Secure: Implement secure JWT handling
# app/auth/security.py
import secrets
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from passlib.context import CryptContext

from app.config import settings
from app.models.user import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using secure hashing"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create secure access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({
        "exp": expire,
        "sub": str(data.get("sub")),
        "type": "access"
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify JWT token securely"""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={
                "verify_exp": True,  # Always verify expiration
                "verify_signature": True  # Always verify signature
            }
        )

        # Additional validation
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
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

async def get_current_user(credentials: HTTPBearer = Depends(security)) -> User:
    """Get current user from token"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id: int = int(payload.get("sub"))

    # Fetch user from database
    # user = get_user_by_id(db, user_id)
    # if user is None:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="User not found",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )
    # return user
```

### Password Security
```python
# ✅ Secure: Implement strong password validation
# app/auth/password_validation.py
import re
from typing import List
from pydantic import validator
from app.exceptions import ValidationException

class PasswordValidator:
    @staticmethod
    def validate_password_strength(password: str) -> List[str]:
        """Validate password strength and return error messages"""
        errors = []

        if len(password) < 12:
            errors.append("Password must be at least 12 characters long")

        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter")

        if not re.search(r"\d", password):
            errors.append("Password must contain at least one digit")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            errors.append("Password must contain at least one special character")

        return errors

    @staticmethod
    def validate_password_change(user_id: int, old_password: str, new_password: str) -> bool:
        """Validate password change request"""
        # Verify old password is correct
        # user = get_user_by_id(user_id)
        # if not verify_password(old_password, user.hashed_password):
        #     raise ValidationException("Current password is incorrect")

        # Validate new password strength
        errors = PasswordValidator.validate_password_strength(new_password)
        if errors:
            raise ValidationException(f"Password validation failed: {'; '.join(errors)}")

        # Check if new password is similar to old password
        if old_password.lower() == new_password.lower():
            raise ValidationException("New password must be different from current password")

        return True
```

## Input Validation and Sanitization

### Request Data Validation
```python
# ✅ Secure: Validate and sanitize request data
# app/schemas/user.py
from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class UserCreate(BaseModel):
    email: str = Field(..., regex=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(..., min_length=12)
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, regex=r'^\+?1?\d{9,15}$')

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

    @validator('full_name')
    def validate_full_name(cls, v):
        """Validate full name"""
        if v is None:
            return v

        # Remove any HTML/JavaScript
        sanitized = re.sub(r'<[^>]*>', '', v).strip()

        if len(sanitized) > 100:
            raise ValueError('Full name is too long')

        return sanitized
```

### SQL Injection Prevention
```python
# ✅ Secure: Use parameterized queries to prevent SQL injection
# app/crud/user.py
from sqlmodel import Session, select
from app.models.user import User
from app.schemas.user import UserCreate

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email using parameterized query"""
    # ✅ Correct: Parameterized query prevents SQL injection
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()

def search_users(db: Session, search_term: str) -> List[User]:
    """Search users with sanitized input"""
    # Sanitize search term to prevent SQL injection
    sanitized_search = search_term.replace('%', '\\%').replace('_', '\\_')

    statement = select(User).where(
        User.email.contains(sanitized_search) |
        User.full_name.contains(sanitized_search)
    )
    return db.exec(statement).all()

def create_user_safe(db: Session, user: UserCreate) -> User:
    """Create user with validated input"""
    # Input is already validated by Pydantic model
    # Password is hashed, not stored in plain text
    hashed_password = get_password_hash(user.password)

    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

## API Security

### Rate Limiting
```python
# ✅ Secure: Implement rate limiting
# app/middleware/rate_limit.py
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from typing import Dict

class RateLimiter:
    def __init__(self, requests: int = 60, window: int = 60):
        self.requests = requests
        self.window = window
        self.requests_dict: Dict[str, list] = defaultdict(list)

    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed based on rate limit"""
        current_time = time.time()

        # Clean old requests
        self.requests_dict[identifier] = [
            req_time for req_time in self.requests_dict[identifier]
            if current_time - req_time < self.window
        ]

        # Check if limit exceeded
        if len(self.requests_dict[identifier]) >= self.requests:
            return False

        # Add current request
        self.requests_dict[identifier].append(current_time)
        return True

# Global rate limiter
rate_limiter = RateLimiter(requests=60, window=60)  # 60 requests per minute

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    # Use IP address as identifier (be aware of proxy considerations)
    client_ip = request.client.host

    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    response = await call_next(request)
    return response
```

### CORS Security
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
        # Development: Allow all for testing
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
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
            allow_headers=["*"],
            # Security: Don't expose sensitive headers
            expose_headers=["Access-Control-Allow-Origin"],
        )

    return app
```

## Data Protection

### Sensitive Data Handling
```python
# ✅ Secure: Handle sensitive data properly
# app/models/user.py
from sqlmodel import Field, SQLModel
from pydantic import computed_field
from typing import Optional

class UserBase(SQLModel):
    email: str = Field(..., description="User email address")
    full_name: Optional[str] = Field(None, description="User full name")
    is_active: bool = Field(True, description="User account status")

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(..., description="BCrypt hashed password")
    phone: Optional[str] = Field(None, description="User phone number")

    # Don't expose sensitive fields in responses
    @computed_field
    @property
    def masked_phone(self) -> Optional[str]:
        """Return masked phone number"""
        if self.phone:
            # Mask phone number: show only last 4 digits
            if len(self.phone) >= 4:
                return "*" * (len(self.phone) - 4) + self.phone[-4:]
        return self.phone

# Response model without sensitive data
class UserResponse(UserBase):
    id: int
    masked_phone: Optional[str] = None
    created_at: datetime

    class Config:
        # Exclude sensitive fields from serialization
        fields = {
            'hashed_password': {'exclude': True}
        }
```

### File Upload Security
```python
# ✅ Secure: Handle file uploads safely
# app/api/v1/files.py
import os
import uuid
from pathlib import Path
from typing import List
from fastapi import UploadFile, HTTPException, status
from app.config import settings

# Define allowed file types and sizes
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file_upload(upload_file: UploadFile) -> bool:
    """Validate file upload security"""
    # Check file size
    if upload_file.size and upload_file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE} bytes"
        )

    # Check file extension
    file_extension = Path(upload_file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Additional security checks
    # Check MIME type (can be spoofed, so also validate after upload)
    if upload_file.content_type not in [
        'text/plain', 'application/pdf',
        'image/png', 'image/jpeg', 'image/gif'
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type"
        )

    return True

def save_uploaded_file(upload_file: UploadFile, user_id: int) -> str:
    """Save uploaded file securely"""
    # Validate file
    validate_file_upload(upload_file)

    # Generate secure filename
    file_extension = Path(upload_file.filename).suffix
    secure_filename = f"{uuid.uuid4()}-{user_id}{file_extension}"

    # Define upload path (outside web root)
    upload_dir = Path(settings.upload_directory) / str(user_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / secure_filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())

    return str(file_path)
```

## Logging and Monitoring Security

### Secure Logging
```python
# ✅ Secure: Log security events without exposing sensitive data
# app/utils/security_logging.py
import logging
from datetime import datetime
from typing import Dict, Any
import json

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
                s in key.lower() for s in ['password', 'token', 'key', 'secret', 'auth', 'credential']
            ):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, str) and any(
                s in key.lower() for s in ['password', 'token', 'key', 'secret', 'auth', 'credential']
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
# requirements.txt
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
celery>=5.3.4

# ❌ Never: Use exact versions that may have known vulnerabilities
# ❌ Never: Install from untrusted sources
```

### Dependency Scanning
```bash
# Security scanning scripts
# scripts/security_scan.sh
#!/bin/bash

echo "Scanning for security vulnerabilities..."

# Check for known vulnerabilities in dependencies
pip install safety
safety check --full-report

# Check for outdated packages
pip list --outdated

# Use pip-audit for more detailed analysis
pip install pip-audit
pip-audit

# Check for unsafe imports in code
python scripts/check_unsafe_imports.py

echo "Security scan completed."
```

## Session and State Management Security

### Secure Session Handling
```python
# ✅ Secure: Handle sessions securely
# app/auth/session.py
from datetime import datetime, timedelta
from typing import Optional
import secrets
from app.database.session import get_db
from app.models.session import SessionModel

class SessionManager:
    @staticmethod
    def create_session(user_id: int, expires_in: int = 3600) -> str:
        """Create secure session"""
        # Generate cryptographically secure session token
        session_token = secrets.token_urlsafe(32)

        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        # Save session to database
        db = next(get_db())
        session = SessionModel(
            token=session_token,
            user_id=user_id,
            expires_at=expires_at,
            created_at=datetime.utcnow()
        )
        db.add(session)
        db.commit()

        return session_token

    @staticmethod
    def validate_session(session_token: str) -> Optional[int]:
        """Validate session and return user_id"""
        db = next(get_db())

        session = db.query(SessionModel).filter(
            SessionModel.token == session_token,
            SessionModel.expires_at > datetime.utcnow(),
            SessionModel.is_active == True
        ).first()

        if session:
            # Update last accessed time
            session.last_accessed = datetime.utcnow()
            db.commit()
            return session.user_id

        return None

    @staticmethod
    def destroy_session(session_token: str) -> bool:
        """Destroy session"""
        db = next(get_db())

        session = db.query(SessionModel).filter(
            SessionModel.token == session_token
        ).first()

        if session:
            session.is_active = False
            db.commit()
            return True

        return False
```

## Error Handling Security

### Secure Error Handling
```python
# ✅ Secure: Handle errors without exposing sensitive information
# app/exceptions/handlers.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.utils.security_logging import log_security_event
import traceback

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions securely"""
    # Log security event
    log_security_event(
        event_type="HTTP_EXCEPTION",
        ip_address=request.client.host,
        details={
            "status_code": exc.status_code,
            "detail": str(exc.detail) if hasattr(exc, 'detail') else "Unknown error"
        }
    )

    # Return generic error message to client
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "An error occurred"},
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
            "error_type": type(exc).__name__
        }
    )

    # Return generic error message to client
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
    )

def register_error_handlers(app):
    """Register secure error handlers"""
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
```

## Security Headers Configuration

### HTTP Security Headers
```python
# ✅ Secure: Configure security headers
# app/middleware/security.py
from fastapi import Request, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
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
            "frame-ancestors 'none';"
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

        return response

def configure_security_middlewares(app):
    """Configure all security middlewares"""
    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # Add trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", ".yourdomain.com"]
    )
```

## Security Testing

### Automated Security Tests
```python
# tests/test_security.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_security_headers():
    """Test that security headers are present"""
    response = client.get("/")

    # Check for security headers
    assert "X-Content-Type-Options" in response.headers
    assert "X-Frame-Options" in response.headers
    assert "X-XSS-Protection" in response.headers

    # Verify header values
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] in ["DENY", "SAMEORIGIN"]

def test_rate_limiting():
    """Test rate limiting functionality"""
    # Make multiple requests
    for i in range(65):  # More than the rate limit
        response = client.get("/")

        if i >= 60:  # Should start returning 429 after rate limit
            if response.status_code == 429:
                break
    else:
        pytest.fail("Rate limiting not working")

def test_authentication_required():
    """Test that authentication is required for protected endpoints"""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401  # Unauthorized

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
```

## Security Checklist

### Security Implementation Checklist
```markdown
# Python Backend Security Checklist

## Before deploying to production:

### Authentication & Authorization
- [ ] JWT tokens properly implemented with secure signing
- [ ] Passwords hashed using bcrypt or similar
- [ ] Authentication required for all sensitive endpoints
- [ ] Authorization checks implemented for user permissions
- [ ] Session management secure with proper timeouts

### Input Validation
- [ ] All user inputs validated and sanitized
- [ ] Pydantic models used for request validation
- [ ] SQL injection prevention implemented (parameterized queries)
- [ ] File upload validation implemented
- [ ] Rate limiting configured

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

These security practices ensure that your Python backend structure remains secure throughout its lifecycle while maintaining the benefits of maintainable and scalable code organization.