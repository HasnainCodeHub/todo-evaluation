# JWT Verification Security Best Practices

## Verification Security

### Algorithm Security
```python
# ✅ Recommended: Specific algorithm enforcement
from jose import jwt

def secure_verify_token(token, public_key):
    # Specify exact algorithm to prevent algorithm confusion
    return jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],  # Only allow RS256
        audience=os.getenv('JWT_AUDIENCE'),
        issuer=os.getenv('JWT_ISSUER')
    )

# ❌ Insecure: Allowing multiple algorithms
def insecure_verify_token(token, secret):
    return jwt.decode(
        token,
        secret,
        algorithms=['HS256', 'RS256', 'none']  # Dangerous!
    )
```

### Signature Verification
```python
# ✅ Secure: Always verify signature
def verify_with_signature_check(token, public_key):
    payload = jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        options={
            'verify_signature': True,  # Always True in production
            'verify_exp': True,
            'verify_nbf': True,
            'verify_iat': True,
            'verify_aud': True,
            'verify_iss': True
        }
    )
    return payload

# ❌ Never: Skip signature verification in production
def skip_signature_verification(token, public_key):
    return jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        options={'verify_signature': False}  # DANGEROUS!
    )
```

## Key Management Security

### Public Key Security
```python
# ✅ Secure: Load public key from environment variables
import os
from jose import jwk

def load_secure_public_key():
    public_key_pem = os.getenv('JWT_PUBLIC_KEY')
    if not public_key_pem:
        raise ValueError("JWT_PUBLIC_KEY environment variable not set")

    # Validate key format
    if not public_key_pem.strip().startswith('-----BEGIN'):
        raise ValueError("Invalid public key format")

    return jwk.get_rsa_public_key(public_key_pem)

# ✅ Secure: JWK Set validation
def validate_and_load_jwks(jwks_data):
    required_fields = ['keys']
    for field in required_fields:
        if field not in jwks_data:
            raise ValueError(f"JWKS missing required field: {field}")

    # Validate each key
    for key in jwks_data['keys']:
        required_key_fields = ['kty', 'use', 'kid', 'n', 'e']
        for field in required_key_fields:
            if field not in key:
                raise ValueError(f"JWK missing required field: {field}")

        # Validate key type for RSA
        if key['kty'] != 'RSA':
            raise ValueError(f"Unsupported key type: {key['kty']}")

    return jwks_data
```

### Key Rotation Support
```python
# ✅ Secure: Support for key rotation
class RotatingKeyVerifier:
    def __init__(self, jwks_uri):
        self.jwks_uri = jwks_uri
        self._jwks_cache = {}
        self._cache_timestamp = 0
        self.cache_ttl = 300  # 5 minutes

    def _get_jwks(self):
        import time
        import requests

        current_time = time.time()
        if (not self._jwks_cache or
            current_time - self._cache_timestamp > self.cache_ttl):

            response = requests.get(self.jwks_uri)
            response.raise_for_status()
            self._jwks_cache = response.json()
            self._cache_timestamp = current_time

        return self._jwks_cache

    def verify_token(self, token):
        import time
        from jose import jwt

        # Get token header to find key ID
        header = jwt.get_unverified_headers(token)
        kid = header.get('kid')

        if not kid:
            raise ValueError("Token missing 'kid' parameter")

        # Get JWKS and find appropriate key
        jwks = self._get_jwks()
        key = None

        for jwk in jwks['keys']:
            if jwk['kid'] == kid:
                key = jwk
                break

        if not key:
            raise ValueError(f"Key with kid '{kid}' not found")

        # Verify token with the found key
        return jwt.decode(
            token,
            key,
            algorithms=[header.get('alg')],
            audience=os.getenv('JWT_AUDIENCE'),
            issuer=os.getenv('JWT_ISSUER')
        )
```

## Token Validation Security

### Claim Validation
```python
# ✅ Secure: Comprehensive claim validation
def validate_claims(payload, expected_audience, expected_issuer):
    import time

    # Required claims validation
    required_claims = ['sub', 'exp', 'iat', 'iss', 'aud']
    for claim in required_claims:
        if claim not in payload:
            raise ValueError(f"Missing required claim: {claim}")

    # Validate expiration with tolerance
    current_time = time.time()
    exp_time = payload['exp']
    tolerance = 30  # 30 seconds tolerance

    if exp_time < current_time - tolerance:
        raise ValueError("Token has expired")

    # Validate issued-at is not in the future
    iat_time = payload['iat']
    if iat_time > current_time + tolerance:
        raise ValueError("Token issued in the future")

    # Validate not-before if present
    if 'nbf' in payload:
        nbf_time = payload['nbf']
        if nbf_time > current_time + tolerance:
            raise ValueError("Token not yet valid")

    # Validate audience
    if isinstance(payload['aud'], str):
        if payload['aud'] != expected_audience:
            raise ValueError("Invalid audience")
    else:  # Array of audiences
        if expected_audience not in payload['aud']:
            raise ValueError("Invalid audience")

    # Validate issuer
    if payload['iss'] != expected_issuer:
        raise ValueError("Invalid issuer")

    return True

def secure_verify_with_claim_validation(token, public_key):
    payload = jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        options={'verify_signature': True}
    )

    validate_claims(
        payload,
        expected_audience=os.getenv('JWT_AUDIENCE'),
        expected_issuer=os.getenv('JWT_ISSUER')
    )

    return payload
```

### Custom Validation
```python
# ✅ Secure: Custom validation for business logic
def custom_business_validation(payload):
    # Validate user is not suspended
    if payload.get('suspended', False):
        raise ValueError("User account is suspended")

    # Validate user has required permissions
    required_permissions = ['read:resource']
    user_permissions = payload.get('permissions', [])

    if not any(perm in user_permissions for perm in required_permissions):
        raise ValueError("Insufficient permissions")

    # Validate token is not from a compromised source
    blacklisted_emails = os.getenv('BLACKLISTED_EMAILS', '').split(',')
    user_email = payload.get('email')

    if user_email and user_email in blacklisted_emails:
        raise ValueError("User email is blacklisted")

    return True
```

## Error Handling Security

### Secure Error Messages
```python
# ✅ Secure: Generic error messages to prevent information disclosure
def secure_verify_token_errors(token, public_key):
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=os.getenv('JWT_AUDIENCE'),
            issuer=os.getenv('JWT_ISSUER')
        )
        return payload
    except jwt.ExpiredSignatureError:
        # Don't reveal that token expired vs invalid signature
        raise ValueError("Invalid or expired token")
    except jwt.JWTError:
        # Don't reveal specific JWT error details
        raise ValueError("Invalid or expired token")
    except Exception:
        # Don't expose internal errors
        raise ValueError("Authentication failed")

# ✅ Log detailed errors securely, return generic responses
def detailed_logging_secure_return(token, public_key):
    import logging
    logger = logging.getLogger(__name__)

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=os.getenv('JWT_AUDIENCE'),
            issuer=os.getenv('JWT_ISSUER')
        )
        return payload
    except Exception as e:
        # Log detailed error for internal debugging
        logger.warning(f"JWT verification failed: {str(e)}", exc_info=True)

        # Return generic error to client
        raise ValueError("Invalid or expired token")
```

## Timing Attack Prevention

### Constant-Time Comparison
```python
# ✅ Secure: Use constant-time comparison for sensitive operations
import hmac

def constant_time_compare(val1, val2):
    """Perform constant-time comparison to prevent timing attacks"""
    return hmac.compare_digest(str(val1), str(val2))

# Example: When comparing token IDs or other sensitive values
def validate_token_id(received_jti, expected_jti):
    return constant_time_compare(received_jti, expected_jti)
```

## Input Validation Security

### Token Format Validation
```python
# ✅ Secure: Validate token format before processing
def is_valid_jwt_format(token):
    if not isinstance(token, str):
        return False

    parts = token.split('.')
    if len(parts) != 3:
        return False

    # Validate base64url encoding of each part
    import base64
    import re

    base64url_pattern = r'^[A-Za-z0-9_-]*$'

    for part in parts:
        if not re.match(base64url_pattern, part):
            return False

        # Check if base64 decoding works
        try:
            # Add padding if needed
            padded_part = part + '=' * (4 - len(part) % 4)
            base64.b64decode(padded_part)
        except Exception:
            return False

    return True

def validate_and_verify_token(token, public_key):
    if not is_valid_jwt_format(token):
        raise ValueError("Invalid JWT format")

    # Proceed with verification
    return jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        audience=os.getenv('JWT_AUDIENCE'),
        issuer=os.getenv('JWT_ISSUER')
    )
```

## Rate Limiting and DoS Protection

### Verification Rate Limiting
```python
# ✅ Secure: Rate limiting for verification endpoints
import time
from collections import defaultdict

class VerificationRateLimiter:
    def __init__(self, max_attempts=10, window_seconds=60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts = defaultdict(list)

    def is_allowed(self, client_identifier):
        current_time = time.time()

        # Clean old attempts
        self.attempts[client_identifier] = [
            timestamp for timestamp in self.attempts[client_identifier]
            if current_time - timestamp < self.window_seconds
        ]

        # Check if within limit
        if len(self.attempts[client_identifier]) >= self.max_attempts:
            return False

        # Record this attempt
        self.attempts[client_identifier].append(current_time)
        return True

# Usage
rate_limiter = VerificationRateLimiter()

def verify_token_with_rate_limit(token, public_key, client_ip):
    if not rate_limiter.is_allowed(client_ip):
        raise ValueError("Too many verification attempts")

    return jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        audience=os.getenv('JWT_AUDIENCE'),
        issuer=os.getenv('JWT_ISSUER')
    )
```

## Implementation Security Patterns

### Secure Dependency Injection
```python
# ✅ Secure: Proper dependency injection for verification
from fastapi import Depends, HTTPException, status
from typing import Dict, Any

class SecureJWTValidator:
    def __init__(self):
        self.public_key = os.getenv('JWT_PUBLIC_KEY')
        self.algorithm = 'RS256'
        self.audience = os.getenv('JWT_AUDIENCE')
        self.issuer = os.getenv('JWT_ISSUER')

    async def __call__(self, authorization: str = Header(None)) -> Dict[str, Any]:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )

        token = authorization[7:]

        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer
            )

            # Additional validation
            if not self._additional_validation(payload):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Additional validation failed"
                )

            return payload

        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

    def _additional_validation(self, payload: Dict[str, Any]) -> bool:
        # Implement custom validation logic
        return True

# Usage in FastAPI
secure_validator = SecureJWTValidator()

@app.get("/secure-endpoint")
async def secure_endpoint(user: Dict = Depends(secure_validator)):
    return {"user": user}
```

## Security Monitoring

### Authentication Event Logging
```python
# ✅ Secure: Log authentication events without exposing sensitive data
import logging
import hashlib

logger = logging.getLogger(__name__)

def log_auth_event(event_type, user_id=None, client_ip=None, success=True):
    """Log authentication events securely"""
    log_data = {
        'event_type': event_type,
        'user_id': user_id,
        'client_ip': client_ip,
        'success': success,
        'timestamp': time.time()
    }

    # Never log full tokens or sensitive claims
    # Hash sensitive data if needed for correlation
    if user_id:
        log_data['user_hash'] = hashlib.sha256(user_id.encode()).hexdigest()

    logger.info(f"AUTH_EVENT: {log_data}")

def verify_with_logging(token, public_key, client_ip):
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=os.getenv('JWT_AUDIENCE'),
            issuer=os.getenv('JWT_ISSUER')
        )

        log_auth_event(
            event_type='TOKEN_VERIFICATION_SUCCESS',
            user_id=payload.get('sub'),
            client_ip=client_ip,
            success=True
        )

        return payload

    except Exception as e:
        # Log failure without exposing token details
        log_auth_event(
            event_type='TOKEN_VERIFICATION_FAILED',
            client_ip=client_ip,
            success=False
        )

        raise ValueError("Invalid or expired token")
```

### Suspicious Activity Detection
```python
# ✅ Secure: Detect and respond to suspicious authentication patterns
class SuspiciousActivityDetector:
    def __init__(self):
        self.failed_attempts = defaultdict(list)
        self.max_attempts = 5
        self.window_minutes = 15

    def record_failure(self, client_ip):
        current_time = time.time()
        self.failed_attempts[client_ip].append(current_time)

        # Clean old attempts
        self.failed_attempts[client_ip] = [
            t for t in self.failed_attempts[client_ip]
            if current_time - t < self.window_minutes * 60
        ]

    def is_suspicious(self, client_ip):
        recent_failures = len(self.failed_attempts[client_ip])
        return recent_failures >= self.max_attempts

# Usage
detector = SuspiciousActivityDetector()

def verify_with_suspicion_detection(token, public_key, client_ip):
    if detector.is_suspicious(client_ip):
        raise ValueError("Account temporarily locked due to suspicious activity")

    try:
        result = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=os.getenv('JWT_AUDIENCE'),
            issuer=os.getenv('JWT_ISSUER')
        )
        return result
    except Exception as e:
        detector.record_failure(client_ip)
        raise
```

## Compliance Considerations

### GDPR Compliance
```python
# ✅ Secure: GDPR-compliant token handling
def handle_gdpr_compliant_token(payload):
    """Process token in GDPR-compliant manner"""
    # Minimize personal data in tokens
    minimal_payload = {
        'sub': payload.get('sub'),  # Pseudonymous identifier
        'role': payload.get('role'),  # Minimal role information
        'exp': payload.get('exp'),
        'iat': payload.get('iat'),
        # ❌ Don't include: email, name, address, etc.
    }

    # Log access without storing personal data
    logger.info(f"User {minimal_payload['sub']} accessed protected resource")

    return minimal_payload
```

### PCI DSS Compliance
```python
# ✅ Secure: Ensure tokens don't contain payment data
def validate_token_for_pci_compliance(payload):
    """Validate that token doesn't contain payment card data"""
    prohibited_fields = [
        'card_number', 'cvv', 'cvc', 'expiry', 'payment_info',
        'credit_card', 'debit_card', 'bank_account'
    ]

    for field in prohibited_fields:
        if field in payload:
            raise ValueError(f"Prohibited field '{field}' found in JWT payload")

    # Additional validation for financial applications
    if 'financial' in payload:
        raise ValueError("Financial data not allowed in JWT")

    return True
```

## Performance Security

### Efficient Verification
```python
# ✅ Secure: Efficient verification without compromising security
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_verify_token(token, public_key):
    """Cached verification for frequently used tokens (use cautiously)"""
    return jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        audience=os.getenv('JWT_AUDIENCE'),
        issuer=os.getenv('JWT_ISSUER')
    )

# ⚠️ WARNING: Only cache verification results briefly and with consideration
# for token expiration and security implications
```

### Resource Limiting
```python
# ✅ Secure: Limit resources used during verification
import signal

class TimeoutException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutException("JWT verification timed out")

def verify_with_timeout(token, public_key, timeout_seconds=5):
    """Verify token with timeout to prevent DoS"""
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout_seconds)

    try:
        result = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=os.getenv('JWT_AUDIENCE'),
            issuer=os.getenv('JWT_ISSUER')
        )
        signal.alarm(0)  # Cancel alarm
        return result
    except TimeoutException:
        raise ValueError("Token verification timed out")
    except Exception as e:
        signal.alarm(0)  # Cancel alarm
        raise
```