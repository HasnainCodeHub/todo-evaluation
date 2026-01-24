# JWT Implementation Patterns

## Frontend Implementation Patterns

### Token Interceptor Pattern
```javascript
// axios-interceptor.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await refreshAccessToken(refreshToken);

        const newToken = response.accessToken;
        sessionStorage.setItem('accessToken', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Token Management Hook
```typescript
// hooks/useAuthTokens.ts
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  role: string;
}

export const useAuthTokens = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedAccessToken = sessionStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedAccessToken) {
      setAccessToken(storedAccessToken);

      try {
        const decoded = jwtDecode<JwtPayload>(storedAccessToken);
        setIsAuthenticated(Date.now() / 1000 < decoded.exp);
      } catch {
        setIsAuthenticated(false);
      }
    }

    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }
  }, []);

  const storeTokens = (access: string, refresh: string) => {
    sessionStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    setAccessToken(access);
    setRefreshToken(refresh);

    try {
      const decoded = jwtDecode<JwtPayload>(access);
      setIsAuthenticated(Date.now() / 1000 < decoded.exp);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const clearTokens = () => {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
  };

  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return Date.now() / 1000 >= decoded.exp;
    } catch {
      return true;
    }
  };

  return {
    accessToken,
    refreshToken,
    isAuthenticated,
    storeTokens,
    clearTokens,
    isTokenExpired,
  };
};
```

## Backend Implementation Patterns

### Express.js JWT Middleware
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// JWKS client for public key retrieval
const client = jwksClient({
  jwksUri: process.env.JWKS_URI,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const jwtMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

module.exports = { jwtMiddleware };
```

### FastAPI JWT Dependency
```python
# auth/jwt.py
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

# Security configuration
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

# Usage in routes
from fastapi import FastAPI, Depends

app = FastAPI()

@app.get("/protected")
async def protected_route(current_user: str = Depends(get_current_user)):
    return {"message": f"Hello {current_user}"}
```

## Token Refresh Patterns

### Silent Refresh Pattern
```javascript
// services/token-refresh.js
class TokenRefreshService {
  constructor() {
    this.refreshPromise = null;
    this.tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes before expiry
  }

  async scheduleRefresh(token) {
    try {
      const decoded = jwt_decode(token);
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Schedule refresh slightly before token expires
      const refreshTime = Math.max(0, timeUntilExpiry - this.tokenExpiryBuffer);

      setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  async refreshToken() {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    try {
      this.refreshPromise = this.performRefresh();
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async performRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      // No refresh token available, redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { accessToken, newRefreshToken } = await response.json();

        sessionStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Schedule next refresh
        this.scheduleRefresh(accessToken);
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      window.location.href = '/login';
    }
  }
}

// Initialize the service
const tokenRefreshService = new TokenRefreshService();

// Start monitoring token expiry
const initialToken = sessionStorage.getItem('accessToken');
if (initialToken) {
  tokenRefreshService.scheduleRefresh(initialToken);
}
```

## Security Patterns

### Token Blacklisting
```javascript
// services/token-blacklist.js
const redis = require('redis');
const client = redis.createClient();

// Add token to blacklist
async function blacklistToken(token, expiryTime) {
  try {
    const decoded = jwt_decode(token);
    const tokenKey = `blacklisted:${decoded.jti || token}`;

    // Store token in blacklist with TTL matching original expiry
    await client.setex(tokenKey, expiryTime, 'true');
  } catch (error) {
    console.error('Error blacklisting token:', error);
  }
}

// Check if token is blacklisted
async function isTokenBlacklisted(token) {
  try {
    const decoded = jwt_decode(token);
    const tokenKey = `blacklisted:${decoded.jti || token}`;

    const result = await client.get(tokenKey);
    return result === 'true';
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false; // Fail open for safety
  }
}

// Middleware to check blacklist
function blacklistMiddleware(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  isTokenBlacklisted(token).then(isBlacklisted => {
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    next();
  }).catch(() => {
    // Error checking blacklist, proceed with caution
    next();
  });
}
```

### Token Rotation
```javascript
// services/token-rotation.js
class TokenRotationService {
  static async rotateTokens(currentRefreshToken) {
    try {
      // Verify current refresh token
      const decoded = jwt.verify(currentRefreshToken, process.env.JWT_REFRESH_PUBLIC_KEY);

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(decoded.sub);
      const newRefreshToken = this.generateRefreshToken(decoded.sub);

      // Blacklist old refresh token (optional)
      await this.blacklistToken(currentRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static generateAccessToken(userId) {
    return jwt.sign(
      { sub: userId, type: 'access' },
      process.env.JWT_PRIVATE_KEY,
      {
        algorithm: 'RS256',
        expiresIn: '15m',
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
      }
    );
  }

  static generateRefreshToken(userId) {
    return jwt.sign(
      { sub: userId, type: 'refresh' },
      process.env.JWT_REFRESH_PRIVATE_KEY,
      {
        algorithm: 'RS256',
        expiresIn: '7d',
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
      }
    );
  }
}
```

## Error Handling Patterns

### Graceful Degradation
```javascript
// services/auth-error-handler.js
class AuthErrorHandler {
  static handleAuthError(error, context) {
    // Log the error for monitoring
    console.error('Authentication error:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });

    switch (error.type) {
      case 'TOKEN_EXPIRED':
        return this.handleTokenExpired(context);

      case 'TOKEN_INVALID':
        return this.handleTokenInvalid(context);

      case 'REFRESH_FAILED':
        return this.handleRefreshFailed(context);

      case 'BLACKLISTED_TOKEN':
        return this.handleBlacklistedToken(context);

      default:
        return this.handleGenericError(context);
    }
  }

  static handleTokenExpired(context) {
    // Attempt silent refresh
    if (context.allowRefresh) {
      return TokenRefreshService.refreshToken()
        .then(newTokens => {
          // Retry original request with new tokens
          return this.retryOriginalRequest(context, newTokens.accessToken);
        })
        .catch(() => {
          // Refresh failed, redirect to login
          this.redirectToLogin();
        });
    } else {
      this.redirectToLogin();
    }
  }

  static handleTokenInvalid(context) {
    // Clear invalid tokens
    this.clearTokens();
    this.redirectToLogin();
  }

  static redirectToLogin() {
    // Store current location for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
  }

  static clearTokens() {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
```

## Anti-Patterns and Solutions

### Anti-Pattern: Storing Tokens in Plain Text
❌ Bad:
```javascript
// Storing tokens in plain localStorage
localStorage.setItem('jwt_token', 'actual-jwt-string-here');
```

✅ Good:
```javascript
// Encrypt tokens before storage
function encryptToken(token, userKey) {
  // Use Web Crypto API or a library like crypto-js
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = crypto.subtle.importKey(
    'raw',
    userKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Implementation would continue with actual encryption
  // For SPA apps, consider httpOnly cookies for refresh tokens
}
```

### Anti-Pattern: Not Checking Token Expiry
❌ Bad:
```javascript
// Not verifying token expiry
function isAuthenticated() {
  return !!sessionStorage.getItem('jwt_token');
}
```

✅ Good:
```javascript
// Checking token expiry
function isAuthenticated() {
  const token = sessionStorage.getItem('jwt_token');
  if (!token) return false;

  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
}
```

### Anti-Pattern: Sharing Secrets Between Frontend and Backend
❌ Bad:
```javascript
// ❌ Sharing secret in frontend code
const JWT_SECRET = 'shared-secret'; // This would be in frontend bundle!
```

✅ Good:
```javascript
// ✅ Use asymmetric cryptography - only public key in frontend
const PUBLIC_KEY = 'public-key-string'; // Safe to include in frontend
// Private key stays on backend only
```

## Performance Optimization

### Token Caching
```javascript
// utils/token-cache.js
class TokenCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // Cache JWKS keys to avoid repeated network requests
  async getCachedJwks(kid) {
    const cached = this.get(`jwks_${kid}`);
    if (cached) return cached;

    const jwk = await fetchJwk(kid);
    this.set(`jwks_${kid}`, jwk);
    return jwk;
  }
}
```