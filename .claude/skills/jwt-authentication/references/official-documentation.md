# JWT Official Documentation and Standards

## Core JWT Specifications

### RFC 7519 - JSON Web Token (JWT)
The core specification that defines JWT structure and usage:
- [RFC 7519](https://tools.ietf.org/html/rfc7519)
- Defines the compact, URL-safe means of representing claims
- Specifies JWT structure: Header.Payload.Signature

### RFC 7515 - JSON Web Signature (JWS)
Defines how to sign JWTs:
- [RFC 7515](https://tools.ietf.org/html/rfc7515)
- Covers signature algorithms and verification

### RFC 7518 - JSON Web Algorithms (JWA)
Specifies cryptographic algorithms for JWT:
- [RFC 7518](https://tools.ietf.org/html/rfc7518)
- Recommended algorithms: RS256, ES256, PS256

## JWT Structure

### Token Format
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Consists of three parts separated by dots:
1. **Header**: Algorithm and token type
2. **Payload**: Claims (user data)
3. **Signature**: Verification signature

### Header Example
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

### Payload Claims
- **Registered claims**: iss, sub, aud, exp, nbf, iat, jti
- **Public claims**: Defined at will
- **Private claims**: Shared between parties

## Security Best Practices

### Algorithm Selection
```javascript
// ✅ Recommended: RSA or ECDSA with public/private keys
{
  "alg": "RS256",
  "typ": "JWT"
}

// ❌ Avoid: Symmetric algorithms with shared secrets
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Claim Best Practices
```javascript
// ✅ Good: Minimal, necessary claims
{
  "sub": "user123",
  "iat": 1516239022,
  "exp": 1516242622,
  "role": "user"
}

// ❌ Bad: Overly verbose or sensitive data
{
  "sub": "user123",
  "email": "user@example.com",
  "password": "hashed_password", // Never include sensitive data
  "ssn": "123-45-6789",       // Never include sensitive data
  "iat": 1516239022,
  "exp": 1516242622
}
```

## Implementation Patterns

### Token Generation (Backend)
```javascript
const jwt = require('jsonwebtoken');

function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };

  const accessToken = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '15m',  // Short-lived access token
    issuer: 'your-app',
    audience: 'your-app-users'
  });

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: '7d',  // Long-lived refresh token
      issuer: 'your-app',
      audience: 'your-app-users'
    }
  );

  return { accessToken, refreshToken };
}
```

### Token Verification (Backend)
```javascript
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: 'your-app',
      audience: 'your-app-users'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Frontend Token Management
```javascript
// Secure token storage
class SecureTokenManager {
  static storeTokens(accessToken, refreshToken) {
    // Store access token in memory-only (not persisted)
    sessionStorage.setItem('accessToken', accessToken);

    // Store refresh token securely (consider httpOnly cookies)
    // For SPA: encrypt and store in localStorage with additional security measures
    const encryptedRefreshToken = encrypt(refreshToken, userKey);
    localStorage.setItem('refreshToken', encryptedRefreshToken);
  }

  static getAccessToken() {
    return sessionStorage.getItem('accessToken');
  }

  static clearTokens() {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
```

## Common Attack Vectors and Mitigation

### 1. Algorithm Confusion Attacks
```javascript
// ❌ Vulnerable to algorithm confusion
jwt.verify(token, secret, { algorithms: ['HS256', 'RS256'] }); // Allows both

// ✅ Secure: Specify exact algorithm
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

### 2. Timing Attacks
```javascript
// ❌ Vulnerable to timing attacks
function validateToken(token) {
  const expected = getTokenFromDB(userId);
  if (token === expected) {  // Timing comparison
    return true;
  }
  return false;
}

// ✅ Secure: Use constant-time comparison
const crypto = require('crypto');

function constantTimeCompare(a, b) {
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
```

### 3. Token Replay Attacks
```javascript
// ✅ Prevent replay attacks with jti (JWT ID) and storage
const usedTokens = new Set(); // In production, use Redis/DynamoDB

function preventReplayAttack(decodedToken) {
  const tokenId = decodedToken.jti;
  if (usedTokens.has(tokenId)) {
    throw new Error('Token already used');
  }

  usedTokens.add(tokenId);
  setTimeout(() => usedTokens.delete(tokenId), decodedToken.exp * 1000);
}
```

## Frontend-Backend Token Flow

### Authentication Flow
```
Frontend                 Backend
   |                        |
   |---- Login Request ---->|
   |                        | 1. Verify credentials
   |                        | 2. Generate JWT
   |<-- JWT Tokens --------|
   |                        | 3. Store tokens securely
   |---- API Request ------>| 4. Include access token in header
   |                        | 5. Verify token
   |<-- API Response -------| 6. Process request
   |                        |
```

### Token Refresh Flow
```
Frontend                 Backend
   |                        |
   |---- Expired Token ---->|
   |                        | 1. Token expired error
   |<-- 401 Unauthorized ---|
   |                        |
   |---- Refresh Request -->| 2. Send refresh token
   |                        | 3. Verify refresh token
   |<-- New JWT Tokens -----| 4. Generate new tokens
   |                        | 5. Return new access token
   |---- Retry Request ---->|
   |<-- API Response -------|
```

## Token Lifecycle Management

### Session Duration Guidelines
- **Access tokens**: 15-30 minutes (short-lived)
- **Refresh tokens**: 7-30 days (long-lived, revocable)
- **Remember me**: Up to 90 days (with additional security)

### Token Rotation Strategy
```javascript
// Implement token rotation to enhance security
function rotateTokens(refreshToken) {
  // 1. Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_PUBLIC_KEY);

  // 2. Generate new tokens
  const newTokens = generateTokens(decoded.sub);

  // 3. Invalidate old refresh token
  invalidateOldToken(decoded.jti);

  // 4. Return new tokens
  return newTokens;
}
```

## Error Handling

### Common JWT Errors
```javascript
function handleJwtErrors(error) {
  switch (error.name) {
    case 'TokenExpiredError':
      // Token has expired
      return { error: 'Token expired', action: 'refresh_token' };

    case 'JsonWebTokenError':
      // Invalid token format or signature
      return { error: 'Invalid token', action: 'reauthenticate' };

    case 'NotBeforeError':
      // Token not yet valid
      return { error: 'Token not active', action: 'reauthenticate' };

    default:
      // Unknown error
      return { error: 'Authentication failed', action: 'reauthenticate' };
  }
}
```

## Compliance and Standards

### Industry Standards
- **OpenID Connect**: Identity layer on top of OAuth 2.0
- **OAuth 2.0**: Authorization framework
- **SAML**: Alternative to JWT for enterprise environments
- **SCIM**: User provisioning and management

### Regulatory Compliance
- **GDPR**: Personal data in JWTs must comply
- **HIPAA**: Healthcare data has special requirements
- **PCI DSS**: Payment card data must never be in JWTs

## Performance Considerations

### Token Size Optimization
```javascript
// ❌ Bad: Large tokens affect performance
{
  "sub": "user123",
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "address": "123 Main St...",
  "phone": "+1234567890",
  "preferences": { /* large object */ },
  "permissions": [ /* large array */ ]
}

// ✅ Good: Minimal essential claims
{
  "sub": "user123",
  "role": "user",
  "perms": ["read", "write"]  // Abbreviated for size
}
```

### Caching Strategies
- Cache public keys to avoid repeated file system/network access
- Use Redis for storing active/invalidate tokens
- Consider CDN for public keys in distributed systems