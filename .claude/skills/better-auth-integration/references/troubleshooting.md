# Better Auth Troubleshooting and Debugging

## Common Issues and Solutions

### 1. Session Not Persisting
**Problem**: User gets logged out after page refresh
**Solution**:
- Check if you're using httpOnly cookies properly
- Verify that your domain/hostname matches in development vs production
- Ensure your API routes are correctly configured

```javascript
// Make sure your auth config includes proper session handling
export const auth = betterAuth({
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update every 24 hours
  },
  database: {
    provider: "sqlite",
    url: process.env.DATABASE_URL!,
  },
});
```

### 2. OAuth Provider Not Working
**Problem**: OAuth login fails with error
**Solution**:
- Verify OAuth app credentials in provider dashboard
- Check callback URLs are registered correctly
- Ensure environment variables are set properly

For Google OAuth:
```
Authorized JavaScript origins: http://localhost:3000
Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
```

### 3. Database Connection Issues
**Problem**: Cannot connect to database
**Solution**:
- Verify DATABASE_URL is correct
- Check that your database server is running
- Ensure proper database permissions

### 4. CORS Issues
**Problem**: Cross-origin requests failing
**Solution**:
```javascript
export const auth = betterAuth({
  cors: {
    origins: [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
  },
});
```

## Debugging Steps

### Step 1: Enable Debug Logging
```javascript
export const auth = betterAuth({
  logger: {
    level: "debug", // Enable debug logging
  },
});
```

### Step 2: Check Environment Variables
```bash
# Verify all required environment variables are set
echo $DATABASE_URL
echo $NEXTAUTH_SECRET
echo $NEXT_PUBLIC_BASE_URL
```

### Step 3: Test Database Connection
```javascript
// test-db-connection.js
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

### Step 4: Verify Auth Endpoint
Test your auth endpoint directly:
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: your-session-cookie"
```

## Error Messages and Solutions

### "Invalid session token"
**Cause**: Session expired or invalid
**Solution**:
- Check session expiration time
- Implement proper session refresh
- Verify session storage is working correctly

### "Provider not configured"
**Cause**: OAuth provider not properly set up
**Solution**:
- Verify provider configuration in auth setup
- Check environment variables for provider credentials
- Ensure provider is enabled

### "Callback URL mismatch"
**Cause**: Redirect URL doesn't match registered URL
**Solution**:
- Check registered callback URLs in OAuth provider
- Verify NEXT_PUBLIC_BASE_URL is correct
- Match protocol (http vs https) between dev/prod

### "CSRF token mismatch"
**Cause**: Cross-site request forgery protection triggered
**Solution**:
- Ensure CSRF tokens are properly passed
- Check if you're making requests from allowed origins
- Verify middleware configuration

## Development vs Production Differences

### Environment Configuration
```javascript
// config/auth.js
const isDevelopment = process.env.NODE_ENV === 'development';

export const authConfig = betterAuth({
  ...(isDevelopment && {
    logger: {
      level: "debug",
    },
  }),
  database: {
    provider: "sqlite",
    url: process.env.DATABASE_URL!,
  },
  // Different cookie settings for dev vs prod
  cookies: {
    domain: isDevelopment ? undefined : '.yourdomain.com',
    secure: !isDevelopment, // Secure cookies only in production
  },
});
```

### Debugging Production Issues
```javascript
// middleware.js - Add debugging in production
import { auth } from './server/auth';

export default auth((req, res) => {
  // Add debugging logs in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Auth request:', {
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      hasAuthHeader: !!req.headers.authorization,
    });
  }
});
```

## Testing Authentication Flows

### Unit Tests for Auth Functions
```typescript
// __tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '../server/auth';

describe('Authentication', () => {
  beforeEach(() => {
    // Mock database calls
    vi.mock('@prisma/client');
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };

    const user = await auth.api.signUp({
      body: userData,
    });

    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
  });

  it('should authenticate user with valid credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };

    const session = await auth.api.signIn({
      body: credentials,
    });

    expect(session).toHaveProperty('sessionToken');
    expect(session).toHaveProperty('user');
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/auth-flow.test.ts
import { test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

let server;

beforeAll(async () => {
  server = app.listen(0); // Random port
});

afterAll(async () => {
  await server.close();
});

test('complete auth flow: register -> login -> access protected -> logout', async () => {
  // Register
  const registerRes = await request(server)
    .post('/api/auth/register')
    .send({
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User'
    })
    .expect(200);

  // Login
  const loginRes = await request(server)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'SecurePassword123!'
    })
    .expect(200);

  const sessionCookie = loginRes.headers['set-cookie'];

  // Access protected route
  const protectedRes = await request(server)
    .get('/api/user/profile')
    .set('Cookie', sessionCookie)
    .expect(200);

  expect(protectedRes.body).toHaveProperty('user');

  // Logout
  await request(server)
    .post('/api/auth/logout')
    .set('Cookie', sessionCookie)
    .expect(200);
});
```

## Performance Debugging

### Identifying Slow Queries
```javascript
// Add query logging
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!,
    options: {
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    },
  },
});

// Listen for slow queries
prisma.$on('query', (e) => {
  if (e.duration >= 1000) { // Log queries taking more than 1 second
    console.warn(`Slow query: ${e.query} took ${e.duration}ms`);
  }
});
```

### Memory Usage Monitoring
```javascript
// Monitor session memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
  });
}, 30000); // Every 30 seconds
```

## Security Auditing

### Common Security Checks
```javascript
// Security audit script
import { auth } from '../server/auth';

async function securityAudit() {
  console.log('🔍 Starting security audit...');

  // Check if password requirements are set
  if (!auth.options.emailAndPassword?.requireEmailVerification) {
    console.warn('⚠️  Email verification not required');
  }

  // Check if HTTPS is enforced in production
  if (process.env.NODE_ENV === 'production' && !auth.options.cookies?.secure) {
    console.error('❌ Secure cookies not enabled in production!');
  }

  // Check rate limiting
  if (!auth.options.rateLimit) {
    console.warn('⚠️  Rate limiting not configured');
  }

  console.log('✅ Security audit completed');
}

securityAudit().catch(console.error);
```

## Monitoring and Observability

### Adding Health Checks
```javascript
// api/health.ts
export default async function handler(req, res) {
  try {
    // Test database connection
    await auth.$client.$queryRaw`SELECT 1`;

    // Test auth system
    const health = await auth.health();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        auth_system: 'ok',
        version: process.env.npm_package_version || 'unknown',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Logging Auth Events
```javascript
// lib/auth-logger.ts
import { createLogger, transports, format } from 'winston';

export const authLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/auth-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/auth-combined.log' }),
  ],
});

// Usage in auth handlers
export function logAuthEvent(event: string, userId?: string, metadata?: any) {
  authLogger.info(`Auth event: ${event}`, {
    userId,
    ip: metadata?.ip,
    userAgent: metadata?.userAgent,
    timestamp: new Date().toISOString(),
  });
}
```