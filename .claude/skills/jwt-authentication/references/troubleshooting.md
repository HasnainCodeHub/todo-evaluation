# JWT Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. Token Verification Failures
**Problem**: JWT verification consistently fails
**Symptoms**: "invalid signature", "wrong number of segments", "algorithm not allowed"
**Solutions**:
- Verify that the secret/key used for verification matches the one used for signing
- Ensure the algorithm specified in the JWT header matches the verification algorithm
- Check for extra whitespace in the token string
- Verify the token hasn't been truncated

```javascript
// ❌ Common mistake: Wrong algorithm
jwt.verify(token, secret, { algorithms: ['HS256'] }); // But token signed with RS256

// ✅ Correct: Match signing and verification algorithms
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

### 2. Token Expiration Issues
**Problem**: Tokens expire too quickly or don't expire when expected
**Symptoms**: Unexpected 401 errors, tokens remaining valid too long
**Solutions**:
- Check system clock synchronization between frontend and backend
- Verify timezone handling in token generation
- Ensure proper handling of `exp` claim during verification
- Consider adding a small buffer for network delays

```javascript
// Check token expiration manually
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // Consider malformed tokens as expired
  }
}
```

### 3. Cross-Domain Token Issues
**Problem**: Tokens not sent or received correctly across domains
**Symptoms**: CORS errors, missing Authorization headers
**Solutions**:
- Configure proper CORS settings on the backend
- Ensure credentials are included in frontend requests
- Check cookie domain/path settings if using cookie storage

```javascript
// Frontend: Include credentials in requests
fetch('/api/protected', {
  method: 'GET',
  credentials: 'include', // Include cookies/credentials
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 4. Refresh Token Failures
**Problem**: Refresh token requests fail unexpectedly
**Symptoms**: User forced to log in frequently, refresh loops
**Solutions**:
- Implement proper refresh token invalidation after use
- Check refresh token storage security
- Verify refresh token expiry times are reasonable
- Implement exponential backoff for failed refresh attempts

## Debugging Steps

### Step 1: Decode and Inspect Token
```javascript
// Decode token without verification to inspect claims
const decoded = jwt.decode(token, { complete: true });
console.log('Token header:', decoded.header);
console.log('Token payload:', decoded.payload);
```

### Step 2: Verify Token Signature Manually
```javascript
// Manual verification to isolate issues
try {
  const verified = jwt.verify(token, secret, {
    algorithms: ['RS256'],
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    clockTolerance: 30 // 30 seconds tolerance
  });
  console.log('Token verified:', verified);
} catch (error) {
  console.error('Verification failed:', error.message);
}
```

### Step 3: Check System Time
```javascript
// Verify system time synchronization
console.log('System time:', new Date().toISOString());
console.log('Token exp:', new Date(decoded.payload.exp * 1000).toISOString());
console.log('Time difference:', (decoded.payload.exp * 1000) - Date.now());
```

## Error Messages and Solutions

### "jwt malformed"
**Cause**: Token format is incorrect
**Solutions**:
- Verify token has correct structure: `header.payload.signature`
- Check for missing or extra dots
- Ensure no URL encoding issues

### "invalid signature"
**Cause**: Signature doesn't match the payload
**Solutions**:
- Verify the correct secret/public key is used
- Check that the signing algorithm matches verification
- Ensure no character corruption during token transmission

### "jwt expired"
**Cause**: Current time is past the token's expiration
**Solutions**:
- Implement automatic token refresh before expiration
- Add clock tolerance if system clocks aren't synchronized
- Verify token expiration time during generation

### "invalid token"
**Cause**: General validation failure
**Solutions**:
- Check all validation parameters (issuer, audience, subject)
- Verify token hasn't been tampered with
- Ensure all required claims are present

## Development vs Production Differences

### Environment Configuration
```javascript
// config/jwt.js
const jwtConfig = {
  development: {
    secret: process.env.JWT_SECRET,
    algorithm: 'HS256', // Less secure but easier for development
    expiresIn: '24h', // Longer for development convenience
    issuer: 'dev-app',
    audience: 'dev-users'
  },
  production: {
    secret: process.env.JWT_PRIVATE_KEY,
    algorithm: 'RS256', // More secure for production
    expiresIn: '15m', // Shorter for security
    issuer: 'prod-app',
    audience: 'prod-users'
  }
};

module.exports = jwtConfig[process.env.NODE_ENV || 'development'];
```

### Debug Logging
```javascript
// middleware/debug-auth.js - Enable in development only
function debugAuth(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.decode(token, { complete: true });
        console.log('JWT Debug:', {
          header: decoded.header,
          payload: decoded.payload,
          token: token.substring(0, 20) + '...'
        });
      } catch (error) {
        console.log('JWT Decode Error:', error.message);
      }
    }
  }
  next();
}
```

## Testing JWT Authentication

### Unit Tests for JWT Functions
```javascript
// tests/jwt.test.js
const jwt = require('jsonwebtoken');
const { expect } = require('chai');

describe('JWT Authentication', () => {
  const secret = 'test-secret';
  const validPayload = { userId: 123, role: 'user' };

  it('should create a valid JWT token', () => {
    const token = jwt.sign(validPayload, secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).to.equal(123);
    expect(decoded.role).to.equal('user');
    expect(decoded.exp).to.be.a('number');
  });

  it('should reject expired tokens', () => {
    const expiredToken = jwt.sign(validPayload, secret, { expiresIn: '-1h' });

    expect(() => jwt.verify(expiredToken, secret)).to.throw(jwt.TokenExpiredError);
  });

  it('should reject invalid signatures', () => {
    const validToken = jwt.sign(validPayload, secret);
    const wrongSecret = 'different-secret';

    expect(() => jwt.verify(validToken, wrongSecret)).to.throw(jwt.JsonWebTokenError);
  });

  it('should handle malformed tokens', () => {
    const malformedToken = 'invalid.token.format';

    expect(() => jwt.verify(malformedToken, secret)).to.throw(jwt.JsonWebTokenError);
  });
});
```

### Integration Tests
```javascript
// tests/api.auth.test.js
const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

describe('Authentication API', () => {
  let validToken, expiredToken;

  beforeAll(() => {
    validToken = jwt.sign(
      { userId: 1, role: 'user' },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: '1h', algorithm: 'RS256' }
    );

    expiredToken = jwt.sign(
      { userId: 1, role: 'user' },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: '-1h', algorithm: 'RS256' }
    );
  });

  test('should accept requests with valid tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });

  test('should reject requests with expired tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error).toContain('expired');
  });

  test('should reject requests without tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);

    expect(response.body.error).toContain('required');
  });

  test('should reject requests with invalid tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    expect(response.body.error).toContain('invalid');
  });
});
```

## Performance Debugging

### Token Verification Performance
```javascript
// utils/performance.js
function measureTokenVerification(token, secret, iterations = 1000) {
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    try {
      jwt.verify(token, secret);
    } catch (error) {
      // Ignore errors for performance measurement
    }
  }

  const endTime = process.hrtime.bigint();
  const totalTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
  const avgTime = totalTime / iterations;

  console.log(`Token verification performance: ${avgTime.toFixed(3)}ms per verification`);
  console.log(`Total time for ${iterations} verifications: ${totalTime.toFixed(3)}ms`);
}
```

### Memory Usage Monitoring
```javascript
// Monitor JWT-related memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log('JWT Service Memory Usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`,
  });
}, 30000); // Every 30 seconds
```

## Security Troubleshooting

### Detecting Token Tampering
```javascript
// security/tamper-detection.js
function detectTokenTampering(token) {
  // Extract the header and payload
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { tampered: true, reason: 'Invalid token structure' };
  }

  try {
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    // Check for suspicious patterns in payload
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i
    ];

    const payloadStr = JSON.stringify(payload);
    const isMalicious = suspiciousPatterns.some(pattern => pattern.test(payloadStr));

    if (isMalicious) {
      return { tampered: true, reason: 'Suspicious content detected' };
    }

    // Check for unusually large payloads
    if (payloadStr.length > 1024) {
      console.warn('Large JWT payload detected - possible abuse');
    }

    return { tampered: false };
  } catch (error) {
    return { tampered: true, reason: 'Malformed token' };
  }
}
```

## Common Misconfigurations

### Incorrect Algorithm Configuration
```javascript
// ❌ Wrong: Using symmetric algorithm with asymmetric key
jwt.sign(payload, publicKey, { algorithm: 'RS256' }); // Signing with public key

// ✅ Correct: Use private key for signing
jwt.sign(payload, privateKey, { algorithm: 'RS256' });

// ❌ Wrong: Accepting any algorithm
jwt.verify(token, secret, { algorithms: ['HS256', 'RS256'] }); // Could allow alg: none

// ✅ Correct: Specify exact algorithm
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

### Improper Secret Management
```javascript
// ❌ Wrong: Hardcoded secrets
const SECRET = 'my-secret-key';

// ✅ Correct: Environment variables
const SECRET = process.env.JWT_SECRET;

// ❌ Wrong: Same secret for signing and verification
const token = jwt.sign(payload, SECRET);
jwt.verify(token, SECRET); // Same secret for both

// ✅ Correct: Different keys for signing and verification (asymmetric)
const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });
jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
```

## Monitoring and Observability

### JWT Authentication Metrics
```javascript
// middleware/auth-metrics.js
const metrics = {
  totalRequests: 0,
  authenticatedRequests: 0,
  failedAuthentications: 0,
  tokenRefreshes: 0,
  expiredTokens: 0
};

function authMetricsMiddleware(req, res, next) {
  metrics.totalRequests++;

  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
      metrics.authenticatedRequests++;
    } catch (error) {
      metrics.failedAuthentications++;

      if (error.name === 'TokenExpiredError') {
        metrics.expiredTokens++;
      }
    }
  }

  // Add cleanup for expired metrics
  res.on('finish', () => {
    // Log metrics periodically
    if (metrics.totalRequests % 100 === 0) {
      console.log('Auth Metrics:', metrics);
    }
  });

  next();
}
```

### Logging Authentication Events
```javascript
// utils/auth-logger.js
const winston = require('winston');

const authLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/auth.log' }),
    new winston.transports.Console()
  ]
});

function logAuthEvent(eventType, userId, metadata = {}) {
  authLogger.info('Auth Event', {
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    ...metadata
  });
}

// Usage
app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode === 401) {
      logAuthEvent('AUTH_FAILURE', null, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
    }
  });
  next();
});
```