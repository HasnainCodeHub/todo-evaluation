# FastAPI Middleware and Security Patterns

## Core Middleware Implementation

### CORS Middleware Configuration
Proper CORS configuration is essential for API security:

```python
# app/core/middleware.py
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from app.core.config import settings


def setup_cors_middleware(app: FastAPI) -> None:
    """Configure CORS middleware."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        # Expose custom headers if needed
        # expose_headers=["Access-Control-Allow-Origin"],
        # Set max age for preflight requests
        # max_age=600,
    )


def setup_cors_middleware_strict(app: FastAPI) -> None:
    """Configure strict CORS middleware for production."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=[
            "X-Requested-With",
            "X-Request-ID",
            "Content-Type",
            "Authorization",
            "X-API-Key",
        ],
        # Only allow specific headers to be exposed
        expose_headers=["X-Request-ID"],
    )
```

### Security Headers Middleware
Implement security headers to protect against common web vulnerabilities:

```python
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers.setdefault("X-Content-Type-Options", "nosniff")

        # Prevent loading of page in a frame to prevent clickjacking
        response.headers.setdefault("X-Frame-Options", "DENY")

        # Enable XSS protection in browsers
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")

        # Prevent loading of external resources
        response.headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")

        # Enable HSTS (HTTP Strict Transport Security)
        if request.url.scheme == "https":
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload"
            )

        # Prevent DNS prefetching
        response.headers.setdefault("X-DNS-Prefetch-Control", "off")

        # Prevent information leakage
        response.headers.setdefault("Referrer-Policy", "no-referrer")

        return response


def setup_security_headers_middleware(app: FastAPI) -> None:
    """Add security headers middleware to the application."""
    app.add_middleware(SecurityHeadersMiddleware)
```

## Authentication Middleware

### JWT Authentication
Implement JWT-based authentication middleware:

```python
# app/core/auth_middleware.py
from fastapi import Request, HTTPException, status
from fastapi.security.http import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable

from app.core.config import settings
from app.models.user import User
from app.services.auth_service import AuthService


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """JWT authentication middleware."""

    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.security = HTTPBearer(auto_error=False)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract token from request
        credentials: HTTPAuthorizationCredentials = await self.security.__call__(request)

        if credentials:
            try:
                # Decode token
                payload = jwt.decode(
                    credentials.credentials,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM]
                )

                # Extract user information
                user_id: str = payload.get("sub")
                if user_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not validate credentials"
                    )

                # Get user from database
                user = AuthService.get_user_by_id(user_id)
                if not user or not user.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found or inactive"
                    )

                # Attach user to request
                request.state.current_user = user

            except JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials"
                )

        response = await call_next(request)
        return response


def setup_auth_middleware(app: FastAPI) -> None:
    """Add authentication middleware to the application."""
    app.add_middleware(JWTAuthMiddleware)
```

### Rate Limiting Middleware
Implement rate limiting to protect against abuse:

```python
# app/core/rate_limiting.py
import time
from collections import defaultdict
from typing import Dict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware."""

    def __init__(self, app: FastAPI, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client IP address
        client_ip = request.client.host

        # Get current time
        now = time.time()

        # Clean old requests (older than 1 minute)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < 60
        ]

        # Check if client has exceeded rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )

        # Record this request
        self.requests[client_ip].append(now)

        response = await call_next(request)
        return response


def setup_rate_limiting_middleware(app: FastAPI) -> None:
    """Add rate limiting middleware to the application."""
    app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
```

## Custom Middleware Implementation

### Request ID Middleware
Add unique request IDs for better debugging and tracing:

```python
# app/core/request_id_middleware.py
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to each request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate or extract request ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        # Add request ID to request state
        request.state.request_id = request_id

        # Add request ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


def setup_request_id_middleware(app: FastAPI) -> None:
    """Add request ID middleware to the application."""
    app.add_middleware(RequestIDMiddleware)
```

### Logging Middleware
Implement comprehensive request logging:

```python
# app/core/logging_middleware.py
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Record start time
        start_time = time.time()

        # Get request ID if available
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))

        # Log request
        logger.info(
            f"Request ID: {request_id} | "
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"IP: {request.client.host} | "
            f"User Agent: {request.headers.get('user-agent', 'Unknown')}"
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Log response
            logger.info(
                f"Request ID: {request_id} | "
                f"Status: {response.status_code} | "
                f"Duration: {duration:.3f}s"
            )

            return response

        except Exception as e:
            # Calculate duration for failed requests
            duration = time.time() - start_time

            # Log error
            logger.error(
                f"Request ID: {request_id} | "
                f"Error: {str(e)} | "
                f"Duration: {duration:.3f}s",
                exc_info=True
            )

            # Re-raise the exception
            raise


def setup_logging_middleware(app: FastAPI) -> None:
    """Add logging middleware to the application."""
    app.add_middleware(LoggingMiddleware)
```

## Security Best Practices

### Input Validation Middleware
Implement additional input validation:

```python
# app/core/validation_middleware.py
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable
import re


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for input validation."""

    # Dangerous patterns to block
    DANGEROUS_PATTERNS = [
        r"<script[^>]*>.*?</script>",  # XSS
        r"javascript:",  # JavaScript URLs
        r"on\w+\s*=",  # Event handlers
        r"eval\s*\(",  # eval function
        r"expression\s*\(",  # CSS expressions
    ]

    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.DANGEROUS_PATTERNS]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check request body for dangerous patterns
        if request.method in ["POST", "PUT", "PATCH"]:
            body_bytes = await request.body()
            body_str = body_bytes.decode('utf-8', errors='ignore')

            for pattern in self.patterns:
                if pattern.search(body_str):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid input detected"
                    )

        # Check query parameters
        for param, value in request.query_params.items():
            if isinstance(value, str):
                for pattern in self.patterns:
                    if pattern.search(value):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid input in parameter {param}"
                        )

        response = await call_next(request)
        return response


def setup_input_validation_middleware(app: FastAPI) -> None:
    """Add input validation middleware to the application."""
    app.add_middleware(InputValidationMiddleware)
```

## Middleware Composition

### Complete Middleware Setup
Combine all middleware in the proper order:

```python
# app/core/middleware.py
from fastapi import FastAPI

from app.core.request_id_middleware import setup_request_id_middleware
from app.core.logging_middleware import setup_logging_middleware
from app.core.rate_limiting import setup_rate_limiting_middleware
from app.core.auth_middleware import setup_auth_middleware
from app.core.validation_middleware import setup_input_validation_middleware


def setup_middleware(app: FastAPI) -> None:
    """Setup all middleware in the correct order."""

    # 1. Request ID middleware (first to generate request IDs)
    setup_request_id_middleware(app)

    # 2. Logging middleware (to log all requests)
    setup_logging_middleware(app)

    # 3. Input validation middleware (to validate before processing)
    setup_input_validation_middleware(app)

    # 4. Rate limiting middleware (to prevent abuse)
    setup_rate_limiting_middleware(app)

    # 5. Authentication middleware (to authenticate users)
    setup_auth_middleware(app)

    # 6. CORS middleware (last to ensure security headers are preserved)
    from app.core.config import settings
    if settings.DEBUG:
        from starlette.middleware.cors import CORSMiddleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Only for development
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        # Production CORS configuration
        from starlette.middleware.cors import CORSMiddleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.BACKEND_CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
            allow_headers=["X-Requested-With", "Content-Type", "Authorization"],
        )
```

## Security Configuration

### Security Settings
Configure security-related settings:

```python
# app/core/security.py
from fastapi import FastAPI
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
    if app.openapi_tags:
        app.openapi_tags.append({
            "name": "security",
            "description": "Security-related endpoints"
        })
```

These middleware and security patterns provide a comprehensive security layer for your FastAPI application, protecting against common web vulnerabilities while maintaining good performance and usability.