# Better Auth Security Best Practices

## Authentication Security

### Password Requirements
```javascript
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      // Enforce strong password requirements
      minLength: 8,
      requireSpecialChar: true,
      requireNumbers: true,
      requireUppercase: true,
      requireLowercase: true,
    },
  },
});
```

### Account Lockout
```javascript
export const auth = betterAuth({
  account: {
    // Prevent brute force attacks
    maxAttempts: 5,
    lockDuration: 15 * 60 * 1000, // 15 minutes
  },
});
```

## Session Security

### Secure Session Configuration
```javascript
export const auth = betterAuth({
  session: {
    expiresIn: 24 * 60 * 60, // 24 hours
    updateAge: 8 * 60 * 60,  // Update every 8 hours
    slidingExpiration: true, // Extend session on activity
  },
  cookies: {
    // Secure cookie settings
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    httpOnly: true,  // Prevent XSS
    path: '/',
  },
});
```

## OAuth Security

### Secure OAuth Configuration
```javascript
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ['openid', 'profile', 'email'], // Minimal required scope
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ['read:user', 'user:email'], // Minimal required scope
    },
  },
});
```

## Input Validation and Sanitization

### Server-Side Validation
```typescript
// api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Additional business logic validation
    if (!isValidUserId(request.nextUrl.pathname.split('/')[2])) {
      return new Response(JSON.stringify({ error: 'Invalid user ID' }), { status: 400 });
    }

    // Proceed with update...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Validation error' }), { status: 500 });
  }
}
```

### Client-Side Validation with Server Backup
```typescript
// components/UserProfileForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields with validation */}
    </form>
  );
}
```

## Rate Limiting

### API Rate Limiting
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.ip ?? request.headers.get("x-forwarded-for");
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:function*", "/api/auth/:path*"],
};
```

## CORS Configuration

### Secure CORS Settings
```javascript
// middleware.ts
import { auth } from "./server/auth";

export default auth((req, res) => {
  // Add CORS headers
  res.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com'
    : 'http://localhost:3000'
  );

  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: res.headers,
    });
  }
});

export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
};
```

## XSS Prevention

### Content Security Policy
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googleapis.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' blob: data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.yourdomain.com; " +
    "frame-src https://accounts.google.com; " +
    "object-src 'none';"
  );

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}
```

## SQL Injection Prevention

### Safe Database Queries
```typescript
// ❌ VULNERABLE - Never do this
const getUserUnsafe = async (userId: string) => {
  return await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
};

// ✅ SECURE - Use parameterized queries
const getUserSafe = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};

// ✅ SECURE - Use Prisma's built-in methods
const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

// ✅ SECURE - For complex queries, use parameterized inputs
const searchUsers = async (searchTerm: string, limit: number = 10) => {
  return await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    take: Math.min(limit, 100), // Prevent excessive results
  });
};
```

## Authentication Token Security

### JWT Best Practices
```javascript
export const auth = betterAuth({
  JWT: {
    secret: process.env.JWT_SECRET!, // Strong secret required
    expiresIn: "7d", // Reasonable expiration
    additionalClaims: {
      // Only include necessary claims
      role: async (user) => user.role,
      permissions: async (user) => user.permissions,
    },
  },
});
```

### Token Rotation
```typescript
// lib/token-rotation.ts
export class TokenRotationService {
  static async rotateTokens(currentRefreshToken: string) {
    // Invalidate current refresh token
    await invalidateRefreshToken(currentRefreshToken);

    // Generate new tokens
    const newTokens = await generateNewTokens(currentRefreshToken);

    return newTokens;
  }

  static async validateAndRefresh(token: string) {
    try {
      // Verify token validity
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      // Check if token is close to expiration (within 1 hour)
      const timeUntilExpiry = (decoded.exp as number) - Date.now() / 1000;

      if (timeUntilExpiry < 3600) { // 1 hour
        // Rotate the token
        return await this.rotateTokens(token);
      }

      return token;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
```

## Audit Logging

### Security Event Logging
```typescript
// lib/security-audit.ts
import { createLogger, transports, format } from 'winston';

export const securityLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/security-events.log' }),
  ],
});

export enum SecurityEvent {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  SUCCESSFUL_LOGIN = 'SUCCESSFUL_LOGIN',
  FAILED_LOGIN = 'FAILED_LOGIN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_DESTROYED = 'SESSION_DESTROYED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export function logSecurityEvent(
  event: SecurityEvent,
  userId: string | null,
  metadata: {
    ip: string;
    userAgent?: string;
    location?: string;
    details?: any;
  }
) {
  securityLogger.info(`${event}`, {
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// Usage example
export async function handleLoginAttempt(
  email: string,
  ip: string,
  userAgent: string
) {
  logSecurityEvent(SecurityEvent.LOGIN_ATTEMPT, null, {
    ip,
    userAgent,
    details: { email },
  });

  try {
    const user = await authenticateUser(email);

    logSecurityEvent(SecurityEvent.SUCCESSFUL_LOGIN, user.id, {
      ip,
      userAgent,
    });

    return user;
  } catch (error) {
    logSecurityEvent(SecurityEvent.FAILED_LOGIN, null, {
      ip,
      userAgent,
      details: { email, error: error.message },
    });

    throw error;
  }
}
```

## Secure File Uploads

### Safe File Handling
```typescript
// api/upload/route.ts
import { NextRequest } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export async function POST(request: NextRequest) {
  const form = formidable({
    uploadDir: UPLOAD_DIR,
    maxFileSize: MAX_FILE_SIZE,
    keepExtensions: true,
    filter: (part) => {
      return part.mimetype ? ALLOWED_TYPES.includes(part.mimetype) : false;
    },
  });

  try {
    const [fields, files] = await form.parse(request);

    // Validate file after upload
    const uploadedFile = files.file[0];
    if (!uploadedFile) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    // Additional security checks
    if (!isValidFileType(uploadedFile.filepath)) {
      fs.unlinkSync(uploadedFile.filepath);
      return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 });
    }

    return new Response(JSON.stringify({
      message: 'File uploaded successfully',
      filename: uploadedFile.originalFilename,
    }));
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 });
  }
}

function isValidFileType(filepath: string): boolean {
  // Additional file type validation
  const buffer = fs.readFileSync(filepath);
  const fileType = require('file-type');
  const detectedType = fileType(buffer);

  return detectedType ? ALLOWED_TYPES.includes(detectedType.mime) : false;
}
```

## Environment Security

### Secure Environment Management
```typescript
// config/secrets.ts
export class SecretManager {
  static validateRequiredEnvVars() {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate secret strength
    this.validateSecretStrength(process.env.JWT_SECRET!);
    this.validateSecretStrength(process.env.NEXTAUTH_SECRET!);
  }

  static validateSecretStrength(secret: string) {
    if (secret.length < 32) {
      throw new Error('Secret must be at least 32 characters long');
    }

    // Check for sufficient entropy
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(secret);
    const hasMixedCase = /[a-z]/.test(secret) && /[A-Z]/.test(secret);
    const hasNumbers = /\d/.test(secret);

    if (!hasSpecialChars || !hasMixedCase || !hasNumbers) {
      throw new Error('Secret must contain special characters, mixed case, and numbers');
    }
  }
}

// Initialize early in application startup
SecretManager.validateRequiredEnvVars();
```

## Dependency Security

### Security Scanning Setup
```json
// package.json - Security scripts
{
  "scripts": {
    "audit": "npm audit --audit-level high",
    "audit:fix": "npm audit --audit-level high --fix",
    "security:check": "snyk test",
    "security:monitor": "snyk monitor"
  },
  "devDependencies": {
    "snyk": "^latest"
  }
}
```

### Regular Security Updates
```bash
# .github/workflows/security-updates.yml
name: Security Updates
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly security audit
  workflow_dispatch:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level high

      - name: Create Security Pull Request
        uses: ahmadnassri/action-dependabot-auto-merge@v2
        with:
          target: minor
          github-token: ${{ secrets.GITHUB_TOKEN }}
```