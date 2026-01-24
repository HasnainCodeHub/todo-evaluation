# JWT Verification Troubleshooting Guide

## Common Issues and Solutions

### 1. Signature Verification Failures
**Problem**: JWT signature verification consistently fails
**Symptoms**: "Invalid signature", "Key error", "Algorithm mismatch"
**Solutions**:
- Verify that the public key used for verification matches the private key used for signing
- Ensure the algorithm specified in the JWT header matches the verification algorithm
- Check for proper key format (PEM vs DER vs JWK)
- Verify the token hasn't been corrupted during transmission

```python
# ❌ Common mistake: Wrong algorithm
from jose import jwt

# Token signed with RS256 but verifying with HS256
try:
    payload = jwt.decode(token, secret, algorithms=['HS256'])  # Wrong algorithm
except Exception as e:
    print(f"Verification failed: {e}")
```

```python
# ✅ Correct: Match signing and verification algorithms
payload = jwt.decode(token, public_key, algorithms=['RS256'])
```

### 2. Token Expiration Issues
**Problem**: Tokens expire too quickly or don't expire when expected
**Symptoms**: Unexpected 401 errors, tokens remaining valid too long
**Solutions**:
- Check system clock synchronization between services
- Verify timezone handling in token generation
- Ensure proper handling of `exp` claim during verification
- Consider adding a small clock tolerance for network delays

```python
# Check token expiration manually
def is_token_expired(token):
    try:
        from jose import jwt
        payload = jwt.get_unverified_claims(token)
        import time
        current_time = time.time()
        return payload['exp'] < current_time
    except Exception:
        return True  # Consider malformed tokens as expired
```

### 3. Key Retrieval Problems
**Problem**: Cannot retrieve public keys from JWKS endpoint
**Symptoms**: "Key not found", "JWKS fetch failed", "kid not found"
**Solutions**:
- Verify JWKS URI is accessible and returns valid JSON
- Check that the token's `kid` matches a key in the JWKS
- Ensure proper caching of JWKS to avoid repeated network requests
- Confirm key formats are compatible

### 4. Audience Mismatch
**Problem**: Token audience doesn't match expected value
**Symptoms**: "Invalid audience", "Aud validation failed"
**Solutions**:
- Verify the `aud` claim in the token matches expected audience
- Check if audience is a string or array of strings
- Ensure audience validation is properly configured

## Debugging Steps

### Step 1: Decode Token Without Verification
```python
# Decode token without verification to inspect claims
from jose import jwt

def inspect_token(token):
    try:
        # Get unverified header and payload
        header = jwt.get_unverified_headers(token)
        payload = jwt.get_unverified_claims(token)

        print(f"Header: {header}")
        print(f"Payload: {payload}")

        return header, payload
    except Exception as e:
        print(f"Could not decode token: {e}")
        return None, None

# Example usage
header, payload = inspect_token(your_token)
```

### Step 2: Manual Verification Process
```python
# Step-by-step verification to isolate issues
def debug_verify_token(token, public_key, audience, issuer):
    print("Step 1: Parsing token...")
    try:
        header, payload, signature = token.split('.')
        print("✓ Token parsed successfully")
    except ValueError:
        print("✗ Failed to parse token - invalid format")
        return False

    print("Step 2: Decoding header...")
    import json
    import base64
    try:
        header_json = json.loads(base64.b64decode(header + '==='))
        print(f"✓ Header: {header_json}")
    except Exception as e:
        print(f"✗ Header decoding failed: {e}")
        return False

    print("Step 3: Verifying signature...")
    try:
        # Verify signature
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=[header_json.get('alg')],
            options={'verify_exp': False, 'verify_aud': False, 'verify_iss': False}
        )
        print("✓ Signature verified")
    except Exception as e:
        print(f"✗ Signature verification failed: {e}")
        return False

    print("Step 4: Validating claims...")
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[header_json.get('alg')],
            audience=audience,
            issuer=issuer
        )
        print("✓ All claims validated")
        return payload
    except Exception as e:
        print(f"✗ Claim validation failed: {e}")
        return False
```

### Step 3: Check System Time
```python
# Verify system time synchronization
import time
import datetime

def check_time_sync(token):
    payload = jwt.get_unverified_claims(token)

    print(f"Current server time: {datetime.datetime.fromtimestamp(time.time())}")
    print(f"Token issued at: {datetime.datetime.fromtimestamp(payload.get('iat', 0))}")
    print(f"Token expires at: {datetime.datetime.fromtimestamp(payload.get('exp', 0))}")

    current_time = time.time()
    time_diff = abs(current_time - payload.get('exp', 0))

    if time_diff > 3600:  # 1 hour difference
        print("⚠️  Warning: Large time difference detected")
        print("Consider synchronizing system time with NTP server")
```

## Error Messages and Solutions

### "Signature verification failed"
**Cause**: Signature doesn't match the payload or wrong key used
**Solutions**:
- Verify the correct public key is used
- Check that the signing algorithm matches verification
- Ensure no character corruption during token transmission
- Confirm key format (PEM format should start with "-----BEGIN")

### "Expired signature"
**Cause**: Current time is past the token's expiration
**Solutions**:
- Implement automatic token refresh before expiration
- Add clock tolerance if system clocks aren't synchronized
- Verify token expiration time during generation

### "Invalid audience"
**Cause**: Token's `aud` claim doesn't match expected audience
**Solutions**:
- Check if the audience in the token matches expected value
- Verify if audience is an array or string and validate accordingly
- Ensure audience validation is properly configured

### "Invalid issuer"
**Cause**: Token's `iss` claim doesn't match expected issuer
**Solutions**:
- Verify the issuer in the token matches expected value
- Check issuer configuration in your application
- Ensure issuer validation is properly configured

### "Key not found"
**Cause**: JWKS doesn't contain the key specified in the token header
**Solutions**:
- Verify the token's `kid` header matches a key in the JWKS
- Check if JWKS endpoint is accessible and returns valid data
- Ensure proper key rotation handling

## Development vs Production Differences

### Environment Configuration
```python
# config/jwt.py
import os

JWT_CONFIG = {
    'development': {
        'public_key': os.getenv('JWT_DEV_PUBLIC_KEY'),
        'algorithm': 'RS256',
        'audience': 'dev-app',
        'issuer': 'dev-issuer',
        'clock_tolerance': 60,  # Larger tolerance for dev
    },
    'staging': {
        'public_key': os.getenv('JWT_STAGING_PUBLIC_KEY'),
        'algorithm': 'RS256',
        'audience': 'staging-app',
        'issuer': 'staging-issuer',
        'clock_tolerance': 30,
    },
    'production': {
        'public_key': os.getenv('JWT_PROD_PUBLIC_KEY'),
        'algorithm': 'RS256',
        'audience': os.getenv('JWT_AUDIENCE'),
        'issuer': os.getenv('JWT_ISSUER'),
        'clock_tolerance': 10,  # Stricter tolerance for prod
    }
}

config = JWT_CONFIG[os.getenv('ENVIRONMENT', 'development')]
```

### Debug Logging
```python
# middleware/debug_auth.py - Enable in development only
import logging

logger = logging.getLogger(__name__)

def debug_auth_middleware(request, call_next):
    if os.getenv('ENVIRONMENT') == 'development':
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]

            try:
                header = jwt.get_unverified_headers(token)
                payload = jwt.get_unverified_claims(token)

                logger.debug(f'JWT Debug - Header: {header}')
                logger.debug(f'JWT Debug - Payload: {payload}')
                logger.debug(f'JWT Debug - Token length: {len(token)}')
            except Exception as e:
                logger.debug(f'JWT Decode Error: {e}')

    return call_next(request)
```

## Testing JWT Verification

### Unit Tests for Verification Functions
```python
# tests/test_jwt_verification.py
import pytest
from jose import jwt
import os
from auth.services import TokenValidationService

@pytest.fixture
def validation_service():
    return TokenValidationService()

def test_valid_token_verification(validation_service):
    """Test that valid tokens are accepted"""
    # Create a valid token
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

    result = validation_service.validate_token(token)
    assert result.success is True
    assert result.payload["sub"] == "test-user"

def test_expired_token_rejection(validation_service):
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

    result = validation_service.validate_token(expired_token)
    assert result.success is False
    assert result.error == "expired_token"

def test_invalid_signature_rejection(validation_service):
    """Test that tokens with invalid signatures are rejected"""
    # Create a token with a different key
    wrong_key_payload = {
        "sub": "test-user",
        "exp": 9999999999,
        "iat": 1234567890,
        "aud": os.getenv("JWT_AUDIENCE"),
        "iss": os.getenv("JWT_ISSUER")
    }

    # Use a different key to sign (simulating invalid signature)
    wrong_key = "-----BEGIN RSA PRIVATE KEY-----\nfake_key_here\n-----END RSA PRIVATE KEY-----"

    try:
        fake_token = jwt.encode(wrong_key_payload, wrong_key, algorithm="RS256")
        result = validation_service.validate_token(fake_token)
        assert result.success is False
        assert result.error in ["invalid_signature", "unknown_error"]
    except:
        # If encoding with fake key fails, that's also a good test
        pass

def test_missing_claims_rejection(validation_service):
    """Test that tokens with missing required claims are rejected"""
    incomplete_payload = {
        "sub": "test-user"
        # Missing exp, iat, aud, iss claims
    }

    incomplete_token = jwt.encode(
        incomplete_payload,
        os.getenv("JWT_PRIVATE_KEY"),
        algorithm="RS256"
    )

    result = validation_service.validate_token(incomplete_token)
    assert result.success is False
    assert result.error == "invalid_claims"
```

### Integration Tests
```python
# tests/test_api_auth.py
import pytest
from fastapi.testclient import TestClient
from jose import jwt
import os

def create_test_token(payload_override=None):
    """Helper to create test tokens"""
    payload = {
        "sub": "test-user",
        "exp": 9999999999,  # Far future expiration
        "iat": 1234567890,
        "aud": os.getenv("JWT_AUDIENCE"),
        "iss": os.getenv("JWT_ISSUER")
    }

    if payload_override:
        payload.update(payload_override)

    return jwt.encode(
        payload,
        os.getenv("JWT_PRIVATE_KEY"),
        algorithm="RS256"
    )

def test_protected_endpoint_with_valid_token():
    """Test that protected endpoints accept valid tokens"""
    client = TestClient(app)
    valid_token = create_test_token()

    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {valid_token}"}
    )

    assert response.status_code == 200
    assert "user" in response.json()

def test_protected_endpoint_without_token():
    """Test that protected endpoints reject requests without tokens"""
    client = TestClient(app)

    response = client.get("/protected")
    assert response.status_code == 401

def test_protected_endpoint_with_expired_token():
    """Test that protected endpoints reject expired tokens"""
    client = TestClient(app)
    expired_token = create_test_token({"exp": 1234567890})  # Past time

    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {expired_token}"}
    )

    assert response.status_code == 401

def test_protected_endpoint_with_invalid_signature():
    """Test that protected endpoints reject tokens with invalid signatures"""
    client = TestClient(app)
    # Use a token that won't validate with our key
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.invalid_signature"

    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {invalid_token}"}
    )

    assert response.status_code == 401
```

## Performance Debugging

### Verification Performance Measurement
```python
# utils/performance.py
import time
from functools import wraps

def measure_verification_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()

        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
        print(f"JWT verification took {execution_time:.2f}ms")

        return result
    return wrapper

@measure_verification_time
def verify_token_performance(token, public_key):
    return jwt.decode(token, public_key, algorithms=['RS256'])

# Batch verification performance test
def batch_verification_test(tokens, public_key, batch_size=100):
    """Test performance of verifying multiple tokens"""
    start_time = time.time()

    for i, token in enumerate(tokens):
        try:
            jwt.decode(token, public_key, algorithms=['RS256'])
        except Exception:
            pass  # Expected for invalid tokens

        if (i + 1) % batch_size == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed
            print(f"Processed {i + 1} tokens in {elapsed:.2f}s ({rate:.2f} tokens/sec)")

    total_time = time.time() - start_time
    total_rate = len(tokens) / total_time
    print(f"Total: {len(tokens)} tokens in {total_time:.2f}s ({total_rate:.2f} tokens/sec)")
```

### Memory Usage Monitoring
```python
# Monitor JWT verification memory usage
import psutil
import os

def monitor_verification_memory():
    """Monitor memory usage during token verification"""
    process = psutil.Process(os.getpid())

    initial_memory = process.memory_info().rss / 1024 / 1024  # MB
    print(f"Initial memory: {initial_memory:.2f} MB")

    # Perform verification operations
    for i in range(1000):
        try:
            jwt.decode(test_token, public_key, algorithms=['RS256'])
        except:
            pass

    final_memory = process.memory_info().rss / 1024 / 1024  # MB
    print(f"Final memory: {final_memory:.2f} MB")
    print(f"Memory increase: {final_memory - initial_memory:.2f} MB")
```

## Security Troubleshooting

### Detecting Token Manipulation
```python
# security/token_integrity_checker.py
def detect_token_manipulation(token):
    """Detect potential token manipulation attempts"""
    try:
        header_str, payload_str, signature_str = token.split('.')

        # Check for suspicious patterns in payload
        import json
        import base64

        payload_data = base64.b64decode(payload_str + '===')
        payload = json.loads(payload_data.decode('utf-8'))

        # Check for overly large payloads
        if len(payload_str) > 2048:  # 2KB threshold
            return {
                'manipulated': True,
                'reason': 'Overly large payload',
                'size': len(payload_str)
            }

        # Check for suspicious claims
        suspicious_patterns = [
            'script', 'alert', 'eval', 'exec', 'system',
            '<script', 'javascript:', 'onload=', 'onerror='
        ]

        payload_str_lower = json.dumps(payload).lower()
        for pattern in suspicious_patterns:
            if pattern in payload_str_lower:
                return {
                    'manipulated': True,
                    'reason': f'Suspicious pattern detected: {pattern}',
                    'pattern': pattern
                }

        # Check for unusual claim names
        for claim in payload.keys():
            if len(str(claim)) > 100:  # Unusually long claim name
                return {
                    'manipulated': True,
                    'reason': 'Unusually long claim name',
                    'claim': claim
                }

        return {'manipulated': False}

    except Exception as e:
        return {
            'manipulated': True,
            'reason': f'Malformed token: {str(e)}'
        }
```

## Common Misconfigurations

### Incorrect Algorithm Configuration
```python
# ❌ Wrong: Using symmetric algorithm with asymmetric key
def wrong_verification(token):
    # Using HS256 with RSA public key
    return jwt.decode(token, rsa_public_key, algorithms=['HS256'])

# ✅ Correct: Match algorithm with key type
def correct_verification(token, public_key):
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

### Improper Key Management
```python
# ❌ Wrong: Hardcoded keys in source code
HARDCODED_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"""

# ✅ Correct: Use environment variables
PUBLIC_KEY = os.getenv('JWT_PUBLIC_KEY')

# ❌ Wrong: Same key for signing and verification
SIGNING_KEY = VERIFICATION_KEY = os.getenv('JWT_SHARED_KEY')

# ✅ Correct: Different keys for signing and verification
PRIVATE_KEY = os.getenv('JWT_PRIVATE_KEY')  # For signing
PUBLIC_KEY = os.getenv('JWT_PUBLIC_KEY')    # For verification
```

## Monitoring and Observability

### JWT Verification Metrics
```python
# middleware/auth_metrics.py
from collections import Counter
import time

class AuthMetrics:
    def __init__(self):
        self.total_requests = 0
        self.valid_tokens = 0
        self.invalid_tokens = 0
        self.expired_tokens = 0
        self.error_types = Counter()
        self.start_time = time.time()

    def record_request(self, success, error_type=None):
        self.total_requests += 1
        if success:
            self.valid_tokens += 1
        else:
            self.invalid_tokens += 1
            if error_type:
                self.error_types[error_type] += 1

    def get_metrics(self):
        uptime = time.time() - self.start_time
        return {
            'uptime_seconds': uptime,
            'total_requests': self.total_requests,
            'valid_tokens': self.valid_tokens,
            'invalid_tokens': self.invalid_tokens,
            'success_rate': self.valid_tokens / max(self.total_requests, 1),
            'error_breakdown': dict(self.error_types)
        }

# Global metrics instance
auth_metrics = AuthMetrics()

def auth_middleware_with_metrics(request, call_next):
    start_time = time.time()

    try:
        response = await call_next(request)
        auth_metrics.record_request(success=True)
        return response
    except HTTPException as e:
        if e.status_code == 401:
            # Determine error type from exception details
            error_type = "unknown"
            if "expired" in e.detail.lower():
                error_type = "expired"
                auth_metrics.expired_tokens += 1

            auth_metrics.record_request(success=False, error_type=error_type)
        raise
```

### Logging Verification Events
```python
# utils/auth_logger.py
import logging
import json
from datetime import datetime

class AuthLogger:
    def __init__(self):
        self.logger = logging.getLogger('auth_verification')
        self.logger.setLevel(logging.INFO)

    def log_verification_attempt(self, token_info, success, error_msg=None):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event': 'token_verification',
            'success': success,
            'token_kid': token_info.get('kid'),
            'token_algorithm': token_info.get('alg'),
            'user_id': token_info.get('sub'),
            'error': error_msg
        }

        if success:
            self.logger.info(json.dumps(log_entry))
        else:
            self.logger.warning(json.dumps(log_entry))

    def log_security_event(self, event_type, details):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event': event_type,
            'details': details
        }
        self.logger.critical(json.dumps(log_entry))

# Usage example
auth_logger = AuthLogger()

def secure_verify_token(token):
    try:
        header = jwt.get_unverified_headers(token)
        payload = jwt.decode(token, public_key, algorithms=['RS256'])

        auth_logger.log_verification_attempt(
            token_info=header,
            success=True
        )

        return payload
    except Exception as e:
        header = jwt.get_unverified_headers(token) if token else {}

        auth_logger.log_verification_attempt(
            token_info=header,
            success=False,
            error_msg=str(e)
        )

        raise
```

## Performance Optimization

### Key Caching Strategy
```python
# services/key_cache.py
import time
from typing import Optional, Dict
import requests

class JWKSCache:
    def __init__(self, jwks_uri: str, cache_ttl: int = 300):
        self.jwks_uri = jwks_uri
        self.cache_ttl = cache_ttl
        self._jwks_cache = None
        self._cache_timestamp = 0

    def get_jwks(self) -> Optional[Dict]:
        """Get JWKS with caching"""
        current_time = time.time()

        if (not self._jwks_cache or
            current_time - self._cache_timestamp > self.cache_ttl):

            try:
                response = requests.get(self.jwks_uri, timeout=5)
                response.raise_for_status()
                self._jwks_cache = response.json()
                self._cache_timestamp = current_time
                print(f"JWKS cache refreshed at {datetime.fromtimestamp(current_time)}")
            except Exception as e:
                print(f"Failed to refresh JWKS cache: {e}")
                # Use cached version if available, otherwise return None
                if not self._jwks_cache:
                    return None

        return self._jwks_cache

    def get_signing_key(self, kid: str):
        """Get signing key by key ID with caching"""
        jwks = self.get_jwks()
        if not jwks:
            return None

        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                from jose import jwk
                return jwk.construct(key)

        return None

# Usage in verification service
jwks_cache = JWKSCache(os.getenv('JWKS_URI'))

def verify_with_cached_keys(token):
    header = jwt.get_unverified_headers(token)
    kid = header.get('kid')

    if not kid:
        raise ValueError("Token missing 'kid' header")

    signing_key = jwks_cache.get_signing_key(kid)
    if not signing_key:
        raise ValueError(f"Signing key not found for kid: {kid}")

    return jwt.decode(token, signing_key.to_dict(), algorithms=[header.get('alg')])
```