# Better Auth Official Documentation References

## Core Concepts

### Installation
```bash
npm install better-auth
# or
yarn add better-auth
# or
pnpm add better-auth
```

### Basic Setup
```javascript
import { betterAuth } from "better-auth";
export const auth = betterAuth({
  database: {
    provider: "sqlite", // or "postgresql", "mysql"
    url: process.env.DATABASE_URL!,
  },
});
```

## Client-Side Setup

### React/Next.js Client
```typescript
"use client";

import { createAuthClient } from "@better-auth/react";

const { useSession, signIn, signOut } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});

// Usage in components
export default function MyComponent() {
  const { data: session } = useSession();
  const { mutate: signInMutate } = signIn();
  const { mutate: signOutMutate } = signOut();

  return (
    <div>
      {session ? (
        <button onClick={() => signOutMutate()}>
          Sign out
        </button>
      ) : (
        <button onClick={() => signInMutate({ provider: "google" })}>
          Sign in with Google
        </button>
      )}
    </div>
  );
}
```

## Provider Configuration

### OAuth Providers
```javascript
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### Email/Password
```javascript
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
});
```

## Session Management

### Custom Session Fields
```javascript
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
});
```

## Middleware Integration

### Next.js Middleware
```javascript
// middleware.ts
import { auth } from "./server/auth";

export default auth();

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## API Route Integration

### API Route Protection
```javascript
// pages/api/protected.ts
import { auth } from "../../server/auth";

export default auth(async (req, res) => {
  // req.user is available here
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Handle protected route logic
  res.json({ message: "Protected route", user: req.user });
});
```

### App Router Integration
```typescript
// app/api/auth/route.ts
import { auth } from "../../../server/auth";

export const GET = auth;

// In protected routes
// app/dashboard/page.tsx
import { auth } from "../../server/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <div>Welcome {session.user.name}</div>;
}
```

## JWT Configuration

### Custom JWT Claims
```javascript
export const auth = betterAuth({
  JWT: {
    expiresIn: "7d",
    additionalClaims: {
      role: async (user) => user.role,
    },
  },
});
```

## Security Best Practices

### Rate Limiting
```javascript
export const auth = betterAuth({
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per window
  },
});
```

### CSRF Protection
```javascript
// Better Auth includes built-in CSRF protection
// Enable for forms
export const auth = betterAuth({
  account: {
    accountSessionThreshold: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
});
```

## Environment Variables

### Required Environment Variables
```
DATABASE_URL= # Your database connection string
GOOGLE_CLIENT_ID= # Google OAuth client ID
GOOGLE_CLIENT_SECRET= # Google OAuth client secret
GITHUB_CLIENT_ID= # GitHub OAuth client ID
GITHUB_CLIENT_SECRET= # GitHub OAuth client secret
NEXTAUTH_SECRET= # Secret for signing JWTs
NEXT_PUBLIC_BASE_URL= # Base URL of your application
```

## Database Setup

### Prisma Schema Example
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Better Auth will generate its own tables
// You can extend with custom tables
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
  role  String @default("user")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Error Handling

### Common Error Responses
- 401: Unauthorized (no valid session)
- 403: Forbidden (insufficient permissions)
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error

### Error Handling Pattern
```javascript
try {
  const result = await signIn({ provider: "google" });
  // Handle success
} catch (error) {
  if (error.status === 401) {
    // Handle authentication error
    setError("Invalid credentials");
  } else if (error.status === 429) {
    // Handle rate limiting
    setError("Too many requests, please try again later");
  } else {
    // Handle other errors
    setError("An unexpected error occurred");
  }
}
```

## Testing Patterns

### Mock Session for Testing
```typescript
// utils/test-utils.ts
export const mockSession = (overrides = {}) => ({
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  },
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});
```

## Migration from Other Auth Systems

### From NextAuth.js
1. Replace NextAuth configuration with Better Auth
2. Update environment variables
3. Update client-side calls to use Better Auth client
4. Migrate user data if needed

### From Clerk
1. Export user data from Clerk
2. Import to your database following Better Auth schema
3. Replace Clerk components with Better Auth equivalents
4. Update middleware and API protections

## Performance Considerations

### Optimizing Database Queries
- Use indexes on frequently queried fields
- Minimize session data stored in JWTs
- Implement proper caching strategies

### Reducing Bundle Size
- Use tree-shaking to import only needed functions
- Lazy load auth components when possible
- Optimize client bundle by code splitting

## Deployment Considerations

### Environment Setup
- Ensure DATABASE_URL is properly configured
- Set NEXT_PUBLIC_BASE_URL correctly
- Configure OAuth provider callbacks for production URL
- Set up SSL certificates for HTTPS

### Scaling
- Use connection pooling for database
- Implement Redis for session storage if needed
- Consider CDN for static assets