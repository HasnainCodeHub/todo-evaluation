# Better Auth Implementation Patterns

## Frontend Integration Patterns

### Hook-Based Session Management
```typescript
// hooks/useAuth.ts
import { createAuthClient } from "@better-auth/react";
import { useEffect, useState } from "react";

const { useSession, signIn, signOut } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});

export const useAuth = () => {
  const { data: session, isLoading } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!session?.user);
  }, [session]);

  return {
    session,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  };
};
```

### Higher-Order Component for Protected Routes
```typescript
// components/withAuth.tsx
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/login");
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
```

## Backend Integration Patterns

### API Route Protection
```typescript
// lib/auth-middleware.ts
import { auth } from "@/server/auth";

export const requireAuth = async (req: any, res: any) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return session;
};

// Usage in API routes
export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  // Continue with protected logic
  res.json({ message: "Success", user: session.user });
}
```

### Role-Based Access Control
```typescript
// lib/rbac.ts
import { auth } from "@/server/auth";

export const requireRole = async (req: any, res: any, roles: string[]) => {
  const session = await requireAuth(req, res);
  if (!session) return null;

  const userRole = session.user.role;
  if (!roles.includes(userRole)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return session;
};

// Usage
export default async function adminHandler(req, res) {
  const session = await requireRole(req, res, ["admin", "moderator"]);
  if (!session) return;

  // Admin-specific logic
  res.json({ message: "Admin access granted" });
}
```

## Error Handling Patterns

### Global Error Handler
```typescript
// lib/auth-errors.ts
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export const handleAuthError = (error: any) => {
  switch (error.status) {
    case 401:
      return new AuthError("Unauthorized access", 401);
    case 403:
      return new AuthError("Access forbidden", 403);
    case 429:
      return new AuthError("Rate limit exceeded", 429);
    default:
      return new AuthError("Authentication error occurred", 500);
  }
};
```

## Security Patterns

### Secure Token Storage
```typescript
// utils/token-storage.ts
export class SecureTokenStorage {
  static setTokens(accessToken: string, refreshToken?: string) {
    // Store access token in memory-only (not persisted)
    sessionStorage.setItem('accessToken', accessToken);

    // Refresh token in httpOnly cookie (handled by Better Auth)
    // We don't manually store refresh tokens for security

    // Clear localStorage (potential security risk)
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
    }
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  static clearTokens() {
    sessionStorage.removeItem('accessToken');
  }
}
```

### Input Validation
```typescript
// lib/input-validation.ts
export const validateAuthInput = {
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  redirectUrl: (url: string, allowedDomains: string[]) => {
    try {
      const parsedUrl = new URL(url);
      return allowedDomains.some(domain =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }
};
```

## State Management Integration

### Zustand Store for Auth State
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { createAuthClient } from '@better-auth/react';

const { useSession, signIn, signOut } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (credentials) => {
    set({ loading: true });
    try {
      await signIn(credentials);
      // User state will be updated via useSession hook
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  refreshUser: () => {
    const session = useSession();
    set({
      user: session.data?.user || null,
      isAuthenticated: !!session.data?.user,
      loading: session.isLoading
    });
  }
}));
```

## Testing Patterns

### Jest Test Helpers
```typescript
// __tests__/helpers/auth-test-helpers.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const mockAuthHandlers = [
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.json({
        user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
        session: { token: 'mock-session-token' }
      })
    );
  }),

  rest.get('/api/auth/session', (req, res, ctx) => {
    const hasValidSession = req.headers.get('authorization') === 'Bearer valid-token';

    if (hasValidSession) {
      return res(
        ctx.json({
          user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      );
    }

    return res(ctx.status(401));
  })
];

export const authServer = setupServer(...mockAuthHandlers);
```

## Common Anti-Patterns and Solutions

### Anti-Pattern: Storing Tokens in LocalStorage
❌ Bad:
```typescript
// Never do this - vulnerable to XSS
localStorage.setItem('authToken', token);
```

✅ Good:
```typescript
// Use httpOnly cookies via Better Auth
// Or session storage for access tokens only
sessionStorage.setItem('accessToken', token);
```

### Anti-Pattern: Ignoring Token Expiration
❌ Bad:
```typescript
// Not checking expiration
const token = sessionStorage.getItem('token');
fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});
```

✅ Good:
```typescript
// Checking expiration before use
const token = sessionStorage.getItem('accessToken');
const exp = sessionStorage.getItem('tokenExp');

if (!token || (exp && new Date().getTime() > parseInt(exp))) {
  // Token expired or doesn't exist, redirect to login
  window.location.href = '/login';
  return;
}

fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Anti-Pattern: Not Validating Redirect URLs
❌ Bad:
```typescript
// Vulnerable to open redirect
const redirect = new URLSearchParams(window.location.search).get('redirect');
window.location.href = redirect; // DANGEROUS!
```

✅ Good:
```typescript
// Validate against allowed domains
const allowedDomains = ['yourapp.com', 'localhost'];
const redirect = new URLSearchParams(window.location.search).get('redirect');

if (validateAuthInput.redirectUrl(redirect, allowedDomains)) {
  window.location.href = redirect;
} else {
  window.location.href = '/dashboard'; // Default safe redirect
}
```

## Performance Optimization

### Code Splitting for Auth Components
```typescript
// components/LazyAuthModal.tsx
import dynamic from 'next/dynamic';

const AuthModal = dynamic(
  () => import('./AuthModal'),
  {
    loading: () => <div>Loading auth...</div>,
    ssr: false
  }
);

export default AuthModal;
```

### Memoization for Session Data
```typescript
// components/UserProfile.tsx
import { useMemo } from 'react';
import { useSession } from '@better-auth/react';

const UserProfile = () => {
  const { data: session } = useSession();

  const userProfileData = useMemo(() => {
    if (!session?.user) return null;

    return {
      name: session.user.name,
      email: session.user.email,
      avatar: session.user.image,
      role: session.user.role
    };
  }, [session?.user]);

  if (!userProfileData) return null;

  return (
    <div className="user-profile">
      <img src={userProfileData.avatar} alt="Avatar" />
      <span>{userProfileData.name}</span>
    </div>
  );
};
```