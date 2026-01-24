# JWT Verification Implementation Patterns

## FastAPI Implementation Patterns

### Dependency Injection Pattern
```python
# auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Dict, Any
import os

# Security scheme
security = HTTPBearer()

# JWT configuration
SECRET_KEY = os.getenv("JWT_PUBLIC_KEY")
ALGORITHM = "RS256"
AUDIENCE = os.getenv("JWT_AUDIENCE")
ISSUER = os.getenv("JWT_ISSUER")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token and return user payload
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            audience=AUDIENCE,
            issuer=ISSUER,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_aud": True,
                "verify_iss": True
            }
        )

        # Additional validation
        if payload.get("sub") is None:
            raise credentials_exception

        return payload

    except JWTError:
        raise credentials_exception
    except Exception as e:
        print(f"JWT verification error: {str(e)}")  # Log for debugging
        raise credentials_exception

# Usage in routes
from fastapi import FastAPI

app = FastAPI()

@app.get("/protected")
async def protected_route(current_user: Dict = Depends(verify_token)):
    return {"message": "Hello", "user": current_user.get("sub")}
```

### Middleware Pattern
```python
# middleware/auth_middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.requests import Request
from jose import jwt, JWTError
import os

class JWTVerificationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.secret_key = os.getenv("JWT_PUBLIC_KEY")
        self.algorithm = "RS256"
        self.audience = os.getenv("JWT_AUDIENCE")
        self.issuer = os.getenv("JWT_ISSUER")

        # Paths that don't require authentication
        self.public_paths = ["/health", "/docs", "/redoc", "/openapi.json"]

    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public paths
        if request.url.path in self.public_paths:
            return await call_next(request)

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Authorization header missing or invalid"}
            )

        token = auth_header[7:]  # Remove "Bearer " prefix

        try:
            # Verify token
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer
            )

            # Add user info to request state
            request.state.user = payload

            response = await call_next(request)
            return response

        except JWTError as e:
            return JSONResponse(
                status_code=401,
                content={"detail": f"Invalid token: {str(e)}"}
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error during token verification"}
            )

# Usage in main app
from fastapi import FastAPI

app = FastAPI()
app.add_middleware(JWTVerificationMiddleware)
```

### Custom Security Class
```python
# auth/security.py
from fastapi.security import HTTPBearer
from fastapi import HTTPException, Request
from jose import jwt, JWTError
from typing import Optional, Dict, Any
import os
import time

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
        self.secret_key = os.getenv("JWT_PUBLIC_KEY")
        self.algorithm = "RS256"
        self.audience = os.getenv("JWT_AUDIENCE")
        self.issuer = os.getenv("JWT_ISSUER")
        self.clock_tolerance = 30  # 30 seconds tolerance

    def __call__(self, request: Request) -> Optional[Dict[str, Any]]:
        authorization = request.headers.get("Authorization")

        if not authorization:
            if self.auto_error:
                raise HTTPException(status_code=401, detail="Not authenticated")
            return None

        try:
            scheme, credentials = authorization.split(" ")
            if scheme.lower() != "bearer":
                if self.auto_error:
                    raise HTTPException(status_code=401, detail="Invalid authentication scheme")
                return None

            decoded_payload = self.verify_jwt(credentials)
            return decoded_payload

        except JWTError:
            if self.auto_error:
                raise HTTPException(status_code=401, detail="Invalid token or expired token")
            return None

    def verify_jwt(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True
                },
                leeway=self.clock_tolerance
            )

            # Additional custom validation
            if not self.validate_custom_claims(payload):
                raise JWTError("Custom validation failed")

            return payload

        except JWTError as e:
            print(f"JWT verification failed: {str(e)}")
            raise

    def validate_custom_claims(self, payload: Dict[str, Any]) -> bool:
        """
        Override this method to add custom claim validation
        """
        # Example: Validate that user has required role
        required_roles = ["user", "admin"]
        user_role = payload.get("role")

        if user_role not in required_roles:
            return False

        return True
```

## Advanced Verification Patterns

### JWK Set Verification
```python
# auth/jwks_verifier.py
from jose import jwt, jwk
from jose.utils import base64url_decode
import requests
import json
from typing import Dict, Any, Optional
import time

class JWKSetVerifier:
    def __init__(self, jwks_uri: str, cache_ttl: int = 300):
        self.jwks_uri = jwks_uri
        self.cache_ttl = cache_ttl
        self._jwks_cache = None
        self._cache_timestamp = 0

    def _get_jwks(self) -> Dict[str, Any]:
        """Get JWKS with caching"""
        current_time = time.time()
        if (not self._jwks_cache or
            current_time - self._cache_timestamp > self.cache_ttl):

            response = requests.get(self.jwks_uri)
            response.raise_for_status()
            self._jwks_cache = response.json()
            self._cache_timestamp = current_time

        return self._jwks_cache

    def get_signing_key(self, kid: str) -> jwk.RSAKey:
        """Get signing key by key ID"""
        jwks = self._get_jwks()

        for key_dict in jwks['keys']:
            if key_dict['kid'] == kid:
                # Convert to JWK object
                return jwk.construct(key_dict)

        raise ValueError(f"Signing key with kid '{kid}' not found")

    def verify_token(self, token: str, audience: str = None, issuer: str = None) -> Dict[str, Any]:
        """Verify token using JWKS"""
        # Decode header to get kid
        header, payload, signature = token.split('.')
        header_json = json.loads(base64url_decode(header.encode()))

        kid = header_json.get('kid')
        if not kid:
            raise ValueError("Token header missing 'kid' parameter")

        # Get the signing key
        signing_key = self.get_signing_key(kid)

        # Verify the token
        try:
            payload = jwt.decode(
                token,
                signing_key.to_dict(),
                algorithms=[header_json.get('alg')],
                audience=audience,
                issuer=issuer
            )

            return payload
        except Exception as e:
            raise ValueError(f"Token verification failed: {str(e)}")

# Usage
jwks_verifier = JWKSetVerifier(os.getenv("JWKS_URI"))

@app.get("/protected")
async def protected_endpoint(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization[7:]

    try:
        payload = jwks_verifier.verify_token(
            token,
            audience=os.getenv("JWT_AUDIENCE"),
            issuer=os.getenv("JWT_ISSUER")
        )
        return {"user": payload}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
```

### Token Validation Service
```python
# services/token_validation_service.py
from typing import Dict, Any, Optional, Tuple
from jose import jwt, JWTError
from enum import Enum
import os
import time
import logging

class ValidationError(Enum):
    INVALID_SIGNATURE = "invalid_signature"
    EXPIRED_TOKEN = "expired_token"
    INVALID_CLAIMS = "invalid_claims"
    MISSING_HEADER = "missing_header"
    UNKNOWN_ERROR = "unknown_error"

class TokenValidationResult:
    def __init__(self, success: bool, payload: Optional[Dict[str, Any]] = None,
                 error: Optional[ValidationError] = None, error_message: str = ""):
        self.success = success
        self.payload = payload
        self.error = error
        self.error_message = error_message

class TokenValidationService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.secret_key = os.getenv("JWT_PUBLIC_KEY")
        self.algorithm = "RS256"
        self.audience = os.getenv("JWT_AUDIENCE")
        self.issuer = os.getenv("JWT_ISSUER")
        self.clock_tolerance = 30

    def validate_token(self, token: str) -> TokenValidationResult:
        """
        Validate JWT token and return detailed result
        """
        if not token:
            return TokenValidationResult(
                success=False,
                error=ValidationError.MISSING_HEADER,
                error_message="Token is missing"
            )

        try:
            # Decode without verification first to check structure
            unverified_payload = jwt.get_unverified_claims(token)

            # Validate required claims exist
            if 'exp' not in unverified_payload:
                return TokenValidationResult(
                    success=False,
                    error=ValidationError.INVALID_CLAIMS,
                    error_message="Token missing required 'exp' claim"
                )

            # Verify the token
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True
                },
                leeway=self.clock_tolerance
            )

            # Additional custom validation
            custom_validation_result = self._custom_validation(payload)
            if not custom_validation_result:
                return TokenValidationResult(
                    success=False,
                    error=ValidationError.INVALID_CLAIMS,
                    error_message="Custom validation failed"
                )

            self.logger.info(f"Token validated successfully for user: {payload.get('sub')}")
            return TokenValidationResult(success=True, payload=payload)

        except jwt.ExpiredSignatureError:
            self.logger.warning("Token validation failed: expired signature")
            return TokenValidationResult(
                success=False,
                error=ValidationError.EXPIRED_TOKEN,
                error_message="Token has expired"
            )
        except jwt.JWTError as e:
            self.logger.warning(f"Token validation failed: {str(e)}")
            return TokenValidationResult(
                success=False,
                error=ValidationError.INVALID_SIGNATURE,
                error_message=f"Invalid token signature: {str(e)}"
            )
        except Exception as e:
            self.logger.error(f"Unexpected error during token validation: {str(e)}")
            return TokenValidationResult(
                success=False,
                error=ValidationError.UNKNOWN_ERROR,
                error_message=f"Unexpected error: {str(e)}"
            )

    def _custom_validation(self, payload: Dict[str, Any]) -> bool:
        """
        Override this method to add custom validation logic
        """
        # Example custom validations
        required_fields = ['sub', 'exp', 'iat']
        for field in required_fields:
            if field not in payload:
                return False

        # Validate that user is not suspended
        if payload.get('suspended', False):
            return False

        return True

# Usage in FastAPI dependency
validation_service = TokenValidationService()

async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")

    token = authorization[7:]
    result = validation_service.validate_token(token)

    if not result.success:
        raise HTTPException(
            status_code=401,
            detail=result.error_message
        )

    return result.payload
```

## Error Handling Patterns

### Graceful Degradation
```python
# auth/error_handlers.py
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class AuthErrorHandler:
    @staticmethod
    def handle_verification_error(error: Exception, token_prefix: str = ""):
        """
        Handle JWT verification errors gracefully
        """
        error_details = {
            'timestamp': time.time(),
            'token_prefix': token_prefix[:10] if token_prefix else 'N/A',
            'error_type': type(error).__name__,
            'error_message': str(error)
        }

        logger.warning(f"JWT verification failed: {error_details}")

        # Log for security monitoring but don't expose details to client
        if isinstance(error, jwt.ExpiredSignatureError):
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has expired"}
            )
        elif isinstance(error, jwt.JWTError):
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token"}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"detail": "Authentication service error"}
            )
```

## Performance Optimization Patterns

### Async Verification
```python
# auth/async_verifier.py
import asyncio
from typing import Dict, Any
from jose import jwt
import aiohttp

class AsyncJWTVerifier:
    def __init__(self, jwks_uri: str):
        self.jwks_uri = jwks_uri
        self._jwks_cache = None
        self._cache_lock = asyncio.Lock()

    async def _fetch_jwks(self) -> Dict[str, Any]:
        """Async fetch JWKS with caching"""
        async with self._cache_lock:
            if self._jwks_cache is None:
                async with aiohttp.ClientSession() as session:
                    async with session.get(self.jwks_uri) as response:
                        self._jwks_cache = await response.json()
            return self._jwks_cache

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Async token verification"""
        # Decode header to get kid
        header, _, _ = token.split('.')
        import json
        import base64
        header_data = json.loads(base64.b64decode(header + '==='))

        kid = header_data.get('kid')
        if not kid:
            raise ValueError("Token header missing 'kid' parameter")

        # Fetch JWKS asynchronously
        jwks = await self._fetch_jwks()

        # Find key
        key = next((k for k in jwks['keys'] if k['kid'] == kid), None)
        if not key:
            raise ValueError(f"Key with kid {kid} not found")

        # Verify token
        return jwt.decode(token, key, algorithms=[header_data.get('alg')])
```

## Security Enhancement Patterns

### Rate Limiting for Auth Endpoints
```python
# auth/rate_limiter.py
import time
from collections import defaultdict
from typing import Dict

class TokenVerificationRateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: Dict[str, list] = defaultdict(list)  # ip -> [timestamps]

    def is_allowed(self, client_ip: str) -> bool:
        """Check if client is allowed to verify tokens"""
        current_time = time.time()

        # Clean old attempts
        self.attempts[client_ip] = [
            timestamp for timestamp in self.attempts[client_ip]
            if current_time - timestamp < self.window_seconds
        ]

        # Check if within limit
        if len(self.attempts[client_ip]) >= self.max_attempts:
            return False

        # Record this attempt
        self.attempts[client_ip].append(current_time)
        return True

# Usage in verification
rate_limiter = TokenVerificationRateLimiter()

def verify_token_with_rate_limit(token: str, client_ip: str):
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many authentication attempts"
        )

    # Proceed with normal verification
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

## Anti-Patterns and Solutions

### Anti-Pattern: Insecure Algorithm Selection
❌ Bad:
```python
# ❌ Never allow algorithm switching
def insecure_verify(token):
    # This allows attackers to switch to 'none' algorithm
    return jwt.decode(token, key='', algorithms=['HS256', 'RS256', 'none'])
```

✅ Good:
```python
# ✅ Always specify exact algorithm
def secure_verify(token, public_key):
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

### Anti-Pattern: Skipping Expiration Check
❌ Bad:
```python
# ❌ Never ignore expiration in production
def skip_expiration_check(token):
    return jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        options={'verify_exp': False}  # DANGEROUS!
    )
```

✅ Good:
```python
# ✅ Always verify expiration
def verify_with_expiration(token, public_key):
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

### Anti-Pattern: Logging Full Tokens
❌ Bad:
```python
# ❌ Never log full tokens
def log_full_token(token):
    logger.info(f"Verifying token: {token}")  # Security risk!
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

✅ Good:
```python
# ✅ Log only token metadata
def log_token_metadata(token):
    import base64
    import json

    header, payload, signature = token.split('.')
    header_data = json.loads(base64.b64decode(header + '=='))

    logger.info(f"Verifying token with kid: {header_data.get('kid')}, alg: {header_data.get('alg')}")
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

## Testing Patterns

### Unit Tests for Verification
```python
# tests/test_jwt_verification.py
import pytest
from jose import jwt
from auth.dependencies import verify_token
import os

@pytest.fixture
def valid_token():
    # Create a valid test token
    payload = {
        "sub": "test-user",
        "exp": 9999999999,  # Far future expiration
        "iat": 1234567890,
        "aud": os.getenv("JWT_AUDIENCE"),
        "iss": os.getenv("JWT_ISSUER")
    }

    token = jwt.encode(
        payload,
        os.getenv("JWT_PRIVATE_KEY"),
        algorithm="RS256"
    )
    return token

def test_valid_token_verification(valid_token):
    """Test that valid tokens are accepted"""
    result = verify_token_mock(valid_token)
    assert result["sub"] == "test-user"

def test_expired_token_rejection():
    """Test that expired tokens are rejected"""
    expired_payload = {
        "sub": "test-user",
        "exp": 1234567890,  # Past expiration
        "iat": 1234567890,
        "aud": os.getenv("JWT_AUDIENCE"),
        "iss": os.getenv("JWT_ISSUER")
    }

    expired_token = jwt.encode(
        expired_payload,
        os.getenv("JWT_PRIVATE_KEY"),
        algorithm="RS256"
    )

    with pytest.raises(Exception):  # Should raise exception for expired token
        verify_token_mock(expired_token)
```

### Integration Tests
```python
# tests/test_auth_integration.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_protected_endpoint_requires_token():
    """Test that protected endpoints require valid tokens"""
    response = client.get("/protected")
    assert response.status_code == 401  # Unauthorized

def test_protected_endpoint_accepts_valid_token(valid_token):
    """Test that protected endpoints accept valid tokens"""
    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {valid_token}"}
    )
    assert response.status_code == 200
    assert "user" in response.json()
```