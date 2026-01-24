# API Integration Best Practices

## Client-Side API Integration Architecture

### API Client Structure

#### Base API Client Setup
Create a centralized API client with common configurations:

```typescript
// lib/api/client.ts
import axios from 'axios';

// Create base instance with defaults
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Service Layer Pattern

#### Individual Service Modules
Create separate service files for different API domains:

```typescript
// lib/api/authService.ts
import apiClient from './client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// lib/api/userService.ts
import apiClient from './client';

export const userService = {
  getUsers: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserRequest) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserRequest) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
```

## Error Handling Strategies

### Global Error Handling
Implement a centralized error handling system:

```typescript
// lib/api/errorHandler.ts
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    return {
      message: data.message || `Server Error: ${status}`,
      status,
      code: data.code || 'SERVER_ERROR',
      details: data.details || null,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network Error: Unable to reach server',
      code: 'NETWORK_ERROR',
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'Unknown Error',
      code: 'UNKNOWN_ERROR',
    };
  }
};

// Usage in services
export const userService = {
  getUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw apiError;
    }
  },
};
```

### Error Boundaries for API Calls
Create error boundary components for API call failures:

```typescript
// components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: any }>;
}

interface State {
  error: any;
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('API Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({ error }: { error: any }) => (
  <div className="error-container">
    <h2>Something went wrong</h2>
    <p>{error?.message || 'An unexpected error occurred'}</p>
    <button onClick={() => window.location.reload()}>
      Reload Page
    </button>
  </div>
);
```

## Caching and Optimization

### Client-Side Caching
Implement intelligent caching for improved performance:

```typescript
// lib/api/cache.ts
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Remove expired cache
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
```

### Request Deduplication
Prevent duplicate requests for the same resource:

```typescript
// lib/api/requestManager.ts
class RequestManager {
  private pendingRequests = new Map<string, Promise<any>>();

  async request<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Make the request
    const promise = requestFn()
      .finally(() => {
        // Clean up when request completes
        this.pendingRequests.delete(key);
      });

    // Store the pending request
    this.pendingRequests.set(key, promise);

    return promise;
  }
}

export const requestManager = new RequestManager();
```

## TypeScript Integration

### Strongly Typed API Services
Ensure type safety throughout your API integration:

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

// lib/api/userService.ts (typed version)
import type { User, CreateUserRequest, UpdateUserRequest, ApiResponse, PaginatedResponse } from '../types/api';
import apiClient from './client';

export const userService = {
  getUsers: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data;
  },
};
```

## API Call Hooks

### Custom React Hooks for API Integration
Create reusable hooks for common API patterns:

```typescript
// hooks/useApiCall.ts
import { useState, useEffect, useCallback } from 'react';

interface ApiCallOptions {
  immediate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useApiCall = <T,>(
  apiFunction: () => Promise<T>,
  options: ApiCallOptions = {}
) => {
  const { immediate = true, autoRefresh = false, refreshInterval = 30000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoRefresh) {
      intervalId = setInterval(execute, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, execute]);

  return { data, loading, error, execute, refetch: execute };
};

// hooks/useCurrentUser.ts
import { useApiCall } from './useApiCall';
import { authService } from '../lib/api/authService';

export const useCurrentUser = () => {
  return useApiCall(() => authService.getCurrentUser(), {
    immediate: !!localStorage.getItem('authToken'),
  });
};

// hooks/useUsers.ts
import { useState } from 'react';
import { useApiCall } from './useApiCall';
import { userService } from '../lib/api/userService';
import type { User } from '../types/api';

export const useUsers = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, loading, error, refetch } = useApiCall(
    () => userService.getUsers({ page, limit }),
    { immediate: true }
  );

  return {
    users: data?.data?.data || [],
    pagination: data?.data?.pagination,
    loading,
    error,
    refetch,
    setPage,
    setLimit,
  };
};
```

## Security Considerations

### Secure Token Management
Implement secure token handling:

```typescript
// lib/auth/tokenManager.ts
class TokenManager {
  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';

  setTokens(accessToken: string, refreshToken: string): void {
    // Store in httpOnly cookie if possible, otherwise in secure storage
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export const tokenManager = new TokenManager();
```

### Request Sanitization
Sanitize data before sending requests:

```typescript
// lib/api/sanitizer.ts
export const sanitizeRequestData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim();
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

// Usage in API client
apiClient.interceptors.request.use(
  (config) => {
    if (config.data) {
      config.data = sanitizeRequestData(config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

Following these API integration best practices ensures secure, efficient, and maintainable API interactions in your frontend applications.