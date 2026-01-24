# JWT Authentication Security Best Practices

## Token Generation Security

### Algorithm Selection
```javascript
// ✅ Recommended: Asymmetric algorithms (RS256, ES256, PS256)
const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, {
  algorithm: 'RS256',
  expiresIn: '15m',
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  jwtid: generateSecureId() // Unique token identifier
});

// ❌ Avoid: Symmetric algorithms (HS256) in distributed systems
// ❌ Avoid: Weak algorithms (none, HS384, HS512)
```

### Payload Security
```javascript
// ✅ Secure: Minimal, essential claims only
const securePayload = {
  sub: user.id,           // Subject (user ID)
  role: user.role,        // User role
  perms: user.permissions, // Compressed permissions array
  iat: Math.floor(Date.now() / 1000), // Issued at
  exp: Math.floor(Date.now() / 1000) + (15 * 60), // Expires in 15 minutes
  jti: crypto.randomUUID() // Unique token ID
};

// ❌ Insecure: Excessive or sensitive data
const insecurePayload = {
  sub: user.id,
  email: user.email,      // Don't include sensitive data
  password: user.passwordHash, // Never include passwords/hashes
  ssn: user.ssn,         // Never include personal identifiers
  creditCard: user.cardInfo, // Never include financial data
  fullAddress: user.address, // Minimize personal data
  preferences: user.preferencesLargeObject // Don't include large objects
};
```

## Token Storage Security

### Frontend Storage
```javascript
// ❌ Never store in localStorage (vulnerable to XSS)
localStorage.setItem('jwt_token', token);

// ❌ Never store in sessionStorage for refresh tokens
sessionStorage.setItem('refresh_token', refreshToken);

// ✅ Secure: Memory-only storage for access tokens
class SecureTokenStorage {
  #accessToken = null;

  setAccessToken(token) {
    this.#accessToken = token;
  }

  getAccessToken() {
    return this.#accessToken;
  }

  clearTokens() {
    this.#accessToken = null;
  }
}

// ✅ Secure: httpOnly cookies for refresh tokens
// Backend: Set secure refresh token cookie
app.post('/login', (req, res) => {
  // ... authentication logic
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
});
```

### Backend Storage Considerations
```javascript
// For refresh token blacklisting (if needed)
const redis = require('redis');
const refreshBlacklist = redis.createClient();

// Add refresh token to blacklist on logout
async function blacklistRefreshToken(token) {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  await refreshBlacklist.setex(`blacklisted:${decoded.jti || token}`, ttl, 'true');
}

// Check if refresh token is blacklisted
async function isRefreshTokenBlacklisted(token) {
  const decoded = jwt.decode(token);
  const result = await refreshBlacklist.get(`blacklisted:${decoded.jti || token}`);
  return result === 'true';
}
```

## Token Transmission Security

### HTTPS Enforcement
```javascript
// ❌ Never transmit tokens over HTTP
// This exposes tokens to interception

// ✅ Always use HTTPS
const express = require('express');
const app = express();

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Secure Headers
```javascript
// ✅ Set security headers
app.use((req, res, next) => {
  // Prevent XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Secure cookies
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
});
```

## Token Validation Security

### Strict Verification
```javascript
// ✅ Secure token verification
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'], // Specify exact algorithm
      issuer: process.env.JWT_ISSUER, // Verify issuer
      audience: process.env.JWT_AUDIENCE, // Verify audience
      clockTolerance: 30, // 30 second tolerance for clock skew
      ignoreExpiration: false // Never ignore expiration
    });
  } catch (error) {
    switch (error.name) {
      case 'TokenExpiredError':
        throw new Error('Token has expired');
      case 'JsonWebTokenError':
        throw new Error('Invalid token format or signature');
      case 'NotBeforeError':
        throw new Error('Token not yet valid');
      default:
        throw new Error('Token verification failed');
    }
  }
}

// ✅ Verify tokens with additional security checks
function secureVerify(token) {
  // First, decode without verification to inspect
  const decoded = jwt.decode(token, { complete: true });

  // Check for security issues
  if (decoded.header.alg !== 'RS256') {
    throw new Error('Unexpected algorithm');
  }

  // Verify with strict parameters
  return verifyToken(token);
}
```

### Timing Attack Prevention
```javascript
// ✅ Use constant-time comparison for token IDs
const crypto = require('crypto');

function constantTimeCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// Use for comparing token IDs or other sensitive comparisons
function validateTokenId(receivedJti, expectedJti) {
  return constantTimeCompare(receivedJti, expectedJti);
}
```

## Token Lifecycle Security

### Short-Lived Access Tokens
```javascript
// ✅ Use short-lived access tokens (15-30 minutes)
const accessToken = jwt.sign(payload, privateKey, {
  expiresIn: '15m', // 15 minutes
  algorithm: 'RS256'
});

// ✅ Implement refresh tokens for extended sessions
const refreshToken = jwt.sign(
  { sub: user.id, type: 'refresh' },
  process.env.JWT_REFRESH_PRIVATE_KEY,
  {
    expiresIn: '7d', // 7 days (store securely)
    algorithm: 'RS256'
  }
);
```

### Token Rotation
```javascript
// ✅ Implement token rotation for refresh tokens
async function rotateRefreshToken(oldRefreshToken, newRefreshToken) {
  // Verify old token
  const oldDecoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_PUBLIC_KEY);

  // Revoke old token
  await revokeToken(oldRefreshToken);

  // Issue new token
  return jwt.sign(
    { sub: oldDecoded.sub, type: 'refresh' },
    process.env.JWT_REFRESH_PRIVATE_KEY,
    {
      expiresIn: '7d',
      algorithm: 'RS256',
      jwtid: generateSecureId() // New unique ID
    }
  );
}

async function revokeToken(token) {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await redis.setex(`revoked:${decoded.jti}`, ttl, 'true');
}
```

## Error Handling Security

### Secure Error Messages
```javascript
// ❌ Don't expose internal details
app.get('/protected', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY);
    res.json({ data: 'protected data' });
  } catch (error) {
    // Don't expose verification details
    res.status(401).json({ error: 'Unauthorized' }); // Generic message
  }
});

// ✅ Log detailed errors securely, return generic responses
app.get('/protected', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.warn('Missing token', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ['RS256']
    });
    res.json({ data: decoded });
  } catch (error) {
    // Log the specific error for debugging
    console.error('Token verification failed', {
      error: error.message,
      tokenPrefix: token.substring(0, 10),
      ip: req.ip
    });

    // Return generic error to client
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```

## Implementation Security Patterns

### Rate Limiting for Auth Endpoints
```javascript
const rateLimit = require('express-rate-limit');

// Protect authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/login', authLimiter, (req, res) => {
  // Login logic here
});
```

### Input Validation
```javascript
// ✅ Validate token format before processing
function isValidJwtFormat(token) {
  if (typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // Basic format checks
  const [header, payload, signature] = parts;

  try {
    // Check if parts are valid base64
    atob(header.replace(/-/g, '+').replace(/_/g, '/'));
    atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    atob(signature.replace(/-/g, '+').replace(/_/g, '/'));
    return true;
  } catch {
    return false;
  }
}

// Use validation before verification
app.use('/protected', (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!isValidJwtFormat(token)) {
    return res.status(400).json({ error: 'Invalid token format' });
  }

  next();
});
```

## Security Monitoring

### Authentication Event Logging
```javascript
// ✅ Log security-relevant authentication events
const securityLogger = require('./utils/security-logger');

function logAuthEvent(eventType, userId, metadata = {}) {
  securityLogger.info('AUTH_EVENT', {
    eventType,
    userId: userId || 'unknown',
    timestamp: new Date().toISOString(),
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    success: metadata.success,
    details: metadata.details
  });
}

// Example usage
app.post('/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body);

    logAuthEvent('LOGIN_SUCCESS', user.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Issue tokens...
  } catch (error) {
    logAuthEvent('LOGIN_FAILED', null, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      details: error.message
    });

    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

### Suspicious Activity Detection
```javascript
// ✅ Detect and respond to suspicious patterns
const suspiciousActivityMonitor = {
  failedAttempts: new Map(), // IP -> count

  recordFailedAttempt(ip) {
    const current = this.failedAttempts.get(ip) || 0;
    this.failedAttempts.set(ip, current + 1);

    if (current + 1 >= 5) { // 5 failed attempts
      this.flagIp(ip);
    }
  },

  flagIp(ip) {
    console.warn('Potential attack detected', { ip });
    // Add to temporary block list, alert security team
  }
};

// Use in authentication middleware
app.post('/login', (req, res, next) => {
  const ip = req.ip;
  const failedCount = suspiciousActivityMonitor.failedAttempts.get(ip) || 0;

  if (failedCount >= 5) {
    return res.status(429).json({ error: 'Too many attempts, please try again later.' });
  }

  next();
});
```

## Compliance Considerations

### GDPR Compliance
```javascript
// ✅ Minimize personal data in tokens
const gdprCompliantPayload = {
  sub: 'user-uuid',    // Pseudonymous identifier
  role: 'user',        // Minimal role information
  exp: Math.floor(Date.now() / 1000) + 900, // Short expiration
  // ❌ Don't include: email, name, preferences, etc.
};

// ✅ Implement right to erasure for token records
async function anonymizeUserTokens(userId) {
  // Revoke all active tokens for user
  await revokeAllUserTokens(userId);

  // Remove from token blacklists
  await removeFromBlacklists(userId);
}
```

### PCI DSS Compliance
```javascript
// ✅ Never include payment data in JWTs
// ❌ Never:
const badPayload = {
  sub: 'user123',
  paymentInfo: { // NEVER store payment data in JWTs
    cardNumber: '1234567890123456',
    cvv: '123',
    expiry: '12/25'
  }
};

// ✅ Always validate that sensitive data is not in tokens
function validatePayloadSecurity(payload) {
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'cvv', 'cardNumber'];

  for (const field of sensitiveFields) {
    if (payload.hasOwnProperty(field)) {
      throw new Error(`Sensitive field '${field}' found in JWT payload`);
    }
  }
}
```

## Key Management Security

### Key Rotation
```javascript
// ✅ Implement key rotation strategy
const keyManager = {
  currentKey: process.env.JWT_CURRENT_PRIVATE_KEY,
  previousKey: process.env.JWT_PREVIOUS_PRIVATE_KEY, // Still valid for verification

  rotateKeys() {
    // Logic to rotate keys safely
    // Ensure old keys remain valid for existing tokens
  },

  getSigningKey() {
    return this.currentKey;
  },

  getAllVerificationKeys() {
    // Return all keys that can verify tokens
    return [this.currentKey, this.previousKey];
  }
};

// Verify with multiple possible keys during rotation
function verifyWithRotation(token) {
  const verificationKeys = keyManager.getAllVerificationKeys();

  for (const key of verificationKeys) {
    try {
      return jwt.verify(token, key, { algorithms: ['RS256'] });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        continue; // Try next key
      }
      throw error; // Re-throw other errors
    }
  }

  throw new Error('Token verification failed with all keys');
}
```