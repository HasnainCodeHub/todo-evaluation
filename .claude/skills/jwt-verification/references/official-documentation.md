# JWT Verification Official Documentation and Standards

## Core JWT Verification Specifications

### RFC 7519 - JSON Web Token (JWT)
The core specification that defines JWT structure and usage:
- [RFC 7519](https://tools.ietf.org/html/rfc7519)
- Defines the compact, URL-safe means of representing claims
- Specifies JWT structure: Header.Payload.Signature

### RFC 7515 - JSON Web Signature (JWS)
Defines how to verify JWT signatures:
- [RFC 7515](https://tools.ietf.org/html/rfc7515)
- Covers signature algorithms and verification procedures

### RFC 7518 - JSON Web Algorithms (JWA)
Specifies cryptographic algorithms for JWT verification:
- [RFC 7518](https://tools.ietf.org/html/rfc7518)
- Recommended algorithms for verification: RS256, ES256, PS256

## JWT Verification Process

### Standard Verification Steps
1. **Parse the JWT**: Split the token into header, payload, and signature
2. **Validate the header**: Check algorithm and token type
3. **Verify the signature**: Use the appropriate public key or secret
4. **Validate claims**: Check expiration, issuer, audience, etc.
5. **Extract user context**: Retrieve user identity from verified claims

### Verification Parameters
Common parameters for JWT verification:
- **algorithms**: List of allowed signing algorithms
- **audience**: Expected audience claim value(s)
- **issuer**: Expected issuer claim value(s)
- **clockTolerance**: Allowed time skew in seconds
- **ignoreExpiration**: Whether to skip expiration check (never use in production)

## Security Considerations

### Algorithm Confusion Prevention
```python
# ❌ Vulnerable to algorithm confusion attacks
jwt.decode(token, secret, algorithms=['HS256', 'RS256'])  # Allows both

# ✅ Secure: Specify exact algorithm
jwt.decode(token, public_key, algorithms=['RS256'])
```

### Key Security
- **Asymmetric keys**: Use public keys for verification, private keys for signing
- **Key rotation**: Implement proper key rotation mechanisms
- **JWK sets**: Use JSON Web Key sets for multi-key scenarios
- **Key caching**: Cache public keys to avoid repeated network requests

## Implementation Standards

### Verification Libraries
#### Python - PyJWT
```python
import jwt
from jwt import PyJWKClient

# Basic verification
def verify_token(token, public_key):
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience='your-app',
            issuer='your-issuer',
            options={
                'verify_signature': True,
                'verify_exp': True,
                'verify_nbf': True,
                'verify_iat': True,
                'verify_aud': True,
                'verify_iss': True
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")
```

#### Python - python-jose
```python
from jose import jwt, JWTError
from jose.constants import ALGORITHMS

def verify_token_jose(token, public_key):
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[ALGORITHMS.RS256],
            audience='your-app',
            issuer='your-issuer'
        )
        return payload
    except JWTError as e:
        raise Exception(f"Token verification failed: {str(e)}")
```

### JWK (JSON Web Key) Handling
```python
# Using JWK sets for key rotation
from jwt import PyJWKClient

def verify_with_jwks(token, jwks_uri):
    jwks_client = PyJWKClient(jwks_uri)

    try:
        # Get the signing key from the JWK set
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode with the retrieved key
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="your-app",
            issuer="your-issuer"
        )

        return decoded
    except Exception as e:
        raise Exception(f"Token verification failed: {str(e)}")
```

## Verification Best Practices

### Claim Validation
```python
def validate_claims(payload):
    # Validate required claims
    assert 'sub' in payload, "Subject claim is required"
    assert 'exp' in payload, "Expiration claim is required"
    assert 'iat' in payload, "Issued at claim is required"

    # Validate audience if present
    if 'aud' in payload:
        expected_audience = 'your-app'
        if isinstance(payload['aud'], str):
            assert payload['aud'] == expected_audience
        else:
            assert expected_audience in payload['aud']

    # Validate issuer if present
    if 'iss' in payload:
        assert payload['iss'] == 'your-issuer'

    # Validate expiration with tolerance
    import time
    current_time = time.time()
    exp_time = payload['exp']
    tolerance = 30  # 30 seconds tolerance

    assert exp_time > current_time - tolerance, "Token has expired"

    # Validate not-before if present
    if 'nbf' in payload:
        assert payload['nbf'] <= current_time + tolerance, "Token not yet valid"
```

### Error Handling Standards
```python
def standardized_error_handling(error):
    """
    Map JWT verification errors to HTTP status codes
    """
    from jwt import ExpiredSignatureError, InvalidSignatureError, DecodeError

    if isinstance(error, ExpiredSignatureError):
        return {
            'error': 'token_expired',
            'message': 'The token has expired',
            'status_code': 401
        }
    elif isinstance(error, InvalidSignatureError):
        return {
            'error': 'invalid_signature',
            'message': 'The token signature is invalid',
            'status_code': 401
        }
    elif isinstance(error, DecodeError):
        return {
            'error': 'invalid_token',
            'message': 'The token format is invalid',
            'status_code': 401
        }
    else:
        return {
            'error': 'verification_failed',
            'message': 'Token verification failed',
            'status_code': 401
        }
```

## Advanced Verification Techniques

### Token Replay Prevention
```python
import redis

class TokenReplayProtection:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.default_ttl = 3600  # 1 hour

    def is_replayed(self, token_id, ttl=None):
        """Check if token ID has been used recently"""
        if ttl is None:
            ttl = self.default_ttl

        if self.redis.exists(f"used_token:{token_id}"):
            return True

        # Mark token as used
        self.redis.setex(f"used_token:{token_id}", ttl, "1")
        return False

def verify_with_replay_protection(token, public_key, replay_protection):
    # Decode without verification to check jti
    header, payload, signature = token.split('.')
    import json
    import base64

    # Decode payload to get jti
    payload_bytes = base64.b64decode(payload + '=' * (4 - len(payload) % 4))
    payload_json = json.loads(payload_bytes.decode('utf-8'))

    if 'jti' in payload_json:
        if replay_protection.is_replayed(payload_json['jti']):
            raise Exception("Token replay detected")

    # Now verify the token
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

### Multi-Tenant Verification
```python
class MultiTenantVerifier:
    def __init__(self):
        self.tenant_keys = {}

    def add_tenant_key(self, tenant_id, public_key):
        self.tenant_keys[tenant_id] = public_key

    def verify_for_tenant(self, token, tenant_id):
        if tenant_id not in self.tenant_keys:
            raise Exception(f"No key found for tenant: {tenant_id}")

        public_key = self.tenant_keys[tenant_id]

        # Verify token with tenant-specific key
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=f'your-app-{tenant_id}'
        )

        # Add tenant context to payload
        payload['tenant_id'] = tenant_id
        return payload
```

## Performance Considerations

### Key Caching
```python
from functools import lru_cache
import time

class CachedJWKClient:
    def __init__(self, jwks_uri, cache_ttl=300):  # 5 minutes
        self.jwks_uri = jwks_uri
        self.cache_ttl = cache_ttl
        self._jwks_cache = None
        self._cache_timestamp = 0

    def _get_jwks(self):
        current_time = time.time()
        if (not self._jwks_cache or
            current_time - self._cache_timestamp > self.cache_ttl):

            import requests
            response = requests.get(self.jwks_uri)
            self._jwks_cache = response.json()
            self._cache_timestamp = current_time

        return self._jwks_cache

    def get_signing_key(self, kid):
        jwks = self._get_jwks()

        for key in jwks['keys']:
            if key['kid'] == kid:
                return key

        raise Exception(f"Key with kid {kid} not found")
```

### Verification Profiling
```python
import time
from functools import wraps

def profile_verification(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()

        print(f"JWT verification took {(end_time - start_time) * 1000:.2f}ms")
        return result
    return wrapper

@profile_verification
def verify_token_performance(token, public_key):
    return jwt.decode(token, public_key, algorithms=['RS256'])
```

## Compliance Standards

### Security Frameworks
- **OWASP ASVS**: Application Security Verification Standard Level 3
- **NIST Cybersecurity Framework**: Identity and Access Management
- **ISO 27001**: Information Security Management Systems
- **SOC 2**: Security and Availability Trust Services Criteria

### Regulatory Compliance
- **GDPR**: Ensure minimal personal data in tokens
- **HIPAA**: Healthcare data compliance for medical applications
- **PCI DSS**: Payment Card Industry Data Security Standard
- **SOX**: Sarbanes-Oxley Act compliance for financial data