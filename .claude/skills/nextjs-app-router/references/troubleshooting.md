# Next.js App Router Troubleshooting Guide

## Common Issues and Solutions

### 1. Route Not Found Issues
**Problem**: Pages don't render or show 404 errors
**Symptoms**: Route returns 404, page doesn't load
**Solutions**:
- Verify file structure follows App Router conventions
- Check that `page.js` files exist in route directories
- Ensure folder names don't conflict with Next.js reserved names

```javascript
// ❌ Wrong: Incorrect file naming
// app/users/index.jsx  // Should be page.js

// ✅ Correct: Proper App Router naming
// app/users/page.js
```

### 2. Server/Client Component Issues
**Problem**: "use client" directive errors or hydration mismatches
**Symptoms**: "Cannot use React Hooks in Server Components" errors
**Solutions**:
- Add `'use client'` directive to client components
- Ensure server components don't use client-only APIs
- Check component boundaries are properly defined

```javascript
// ❌ Wrong: Using client hooks in server component
// app/users/[id]/page.js
import { useState } from 'react'  // This will cause an error

export default function UserPage({ params }) {
  const [count, setCount] = useState(0)  // Error: Can't use hooks in server component
  return <div>User {params.id}</div>
}

// ✅ Correct: Server component for data fetching
// app/users/[id]/page.js
import { getUser } from '@/lib/users'

export default async function UserPage({ params }) {
  const user = await getUser(params.id)
  return <UserProfile user={user} />
}

// app/users/[id]/user-profile.js
'use client'
import { useState } from 'react'

export default function UserProfile({ user }) {
  const [count, setCount] = useState(0)  // OK: Client component
  return <div>{user.name}</div>
}
```

### 3. Data Fetching Problems
**Problem**: Data not loading or caching issues
**Symptoms**: Stale data, unexpected loading states, performance issues
**Solutions**:
- Use appropriate caching strategies
- Implement proper error handling
- Follow server component data fetching patterns

### 4. Layout and Styling Issues
**Problem**: Layouts not rendering correctly or styles not applying
**Symptoms**: CSS not loading, layout shifts, shared UI not appearing
**Solutions**:
- Ensure global CSS is imported in root layout
- Check layout component structure
- Verify CSS modules and Tailwind configuration

## Debugging Steps

### Step 1: Verify Directory Structure
```bash
# Check if the app directory structure is correct
ls -la app/
# Should see:
# layout.js (or layout.tsx)
# page.js (or page.tsx)
# And other route segments

# Check specific route
ls -la app/users/
# Should see page.js or other route files
```

### Step 2: Check Route Definitions
```javascript
// Verify the route structure is correct
// app/users/[id]/page.js
export default async function UserPage({ params }) {
  console.log('Params:', params) // Debug parameter access
  return <div>User ID: {params.id}</div>
}
```

### Step 3: Test Data Fetching
```javascript
// app/debug-test/page.js
async function testDataFetch() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
    const user = await res.json()
    console.log('Fetched user:', user) // Debug data
    return user
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

export default async function DebugPage() {
  const user = await testDataFetch()

  if (!user) {
    return <div>Error loading data</div>
  }

  return <div>Debug: {user.name}</div>
}
```

## Error Messages and Solutions

### "Module parse failed" errors
**Cause**: Incorrect syntax or missing directives
**Solutions**:
- Add `'use client'` to client components
- Check for syntax errors in JSX
- Verify all imports are correct

### "Hydration failed" errors
**Cause**: Server and client render different content
**Solutions**:
- Ensure server and client render identical content initially
- Use `useState` with initial values from server props
- Check for conditional rendering differences

```javascript
// ❌ Wrong: Different server/client rendering
'use client'

export default function Component() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return <div>{mounted ? 'Client' : 'Server'}</div> // Different content
}

// ✅ Correct: Consistent initial render
'use client'

export default function Component({ initialData }) {
  const [data, setData] = useState(initialData) // Use server-provided initial state

  return <div>{data.content}</div>
}
```

### "Cannot read properties of undefined" in params
**Cause**: Dynamic route parameters not handled properly
**Solutions**:
- Check route folder names match expected patterns
- Verify parameter names in destructuring
- Add proper error handling for missing params

### "'use client' cannot be used outside of modules"
**Cause**: Placement of directive is incorrect
**Solutions**:
- Place `'use client'` at the very top of the file
- Ensure it's before any imports
- Check file extension is correct (.js, .jsx, .ts, .tsx)

## Development vs Production Differences

### Environment Configuration
```javascript
// config/next-config.js
const nextConfig = {
  experimental: {
    appDir: true, // Enable App Router
  },
  // Development-specific settings
  ...(process.env.NODE_ENV === 'development' && {
    cache: false, // Disable cache in development
  }),
  // Production-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    cache: true, // Enable cache in production
  }),
}
```

### Debug Logging
```javascript
// utils/debug.js
export function debugLog(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG]', ...args)
  }
}

// Use in components
// app/users/[id]/page.js
import { debugLog } from '@/utils/debug'

export default async function UserPage({ params }) {
  debugLog('Loading user page', params.id)
  // ... rest of component
}
```

## Testing App Router Applications

### Unit Tests for Components
```javascript
// tests/unit/user-page.test.js
import { render } from '@testing-library/react'
import UserPage from '@/app/users/[id]/page'

// Mock async server component
jest.mock('@/app/users/[id]/page', () => {
  return {
    __esModule: true,
    default: jest.fn(({ params }) => (
      <div data-testid="user-page">User {params.id}</div>
    ))
  }
})

describe('UserPage', () => {
  it('renders user page with correct ID', async () => {
    const params = { id: '123' }
    const { getByTestId } = render(<UserPage params={params} />)

    expect(getByTestId('user-page')).toHaveTextContent('User 123')
  })
})
```

### Integration Tests
```javascript
// tests/integration/routing.test.js
import { test, expect } from '@playwright/test'

test.describe('App Router Integration', () => {
  test('should navigate to user page', async ({ page }) => {
    await page.goto('/users/123')
    await expect(page.locator('text=123')).toBeVisible()
  })

  test('should handle 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-route')
    await expect(page.locator('text=404')).toBeVisible()
  })
})
```

## Performance Debugging

### Bundle Analysis
```bash
# Analyze bundle size
npm install @next/bundle-analyzer
# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  experimental: {
    appDir: true,
  },
})

# Run analysis
ANALYZE=true npm run build
```

### Component Rendering Optimization
```javascript
// utils/performance.js
import { memo } from 'react'

// Memoize expensive components
export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Expensive rendering logic
  return <div>{/* rendered content */}</div>
})

// Add React DevTools profiling
export function withProfiling(Component, componentName) {
  if (process.env.NODE_ENV === 'development') {
    return React.memo(Component, () => false) // Force update for profiling
  }
  return Component
}
```

## Security Troubleshooting

### SSRF Protection
```javascript
// lib/safe-fetch.js
const ALLOWED_DOMAINS = [
  'api.example.com',
  'cdn.example.com'
]

export async function safeFetch(url, options = {}) {
  const parsedUrl = new URL(url)

  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    throw new Error(`Blocked fetch to disallowed domain: ${parsedUrl.hostname}`)
  }

  return fetch(url, options)
}
```

### Input Sanitization
```javascript
// utils/sanitize.js
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  })
}

// In server components
export default async function ContentPage({ params }) {
  const content = await getContent(params.id)
  const sanitizedContent = sanitizeHTML(content.body)

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  )
}
```

## Common Misconfigurations

### Incorrect App Directory Setup
❌ Bad:
```javascript
// Wrong: Using Pages Router structure in App Router
// pages/index.js  <- Should be app/page.js
export default function Home() {
  return <div>Home</div>
}
```

✅ Good:
```javascript
// Correct: App Router structure
// app/page.js
export default function HomePage() {
  return <div>Home</div>
}
```

### Missing Layout Structure
❌ Bad:
```javascript
// app/page.js without root layout
export default function Home() {
  return (
    <html>
      <body>Home</body>
    </html>
  )
}
```

✅ Good:
```javascript
// app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// app/page.js
export default function HomePage() {
  return <div>Home</div>
}
```

### Improper Client Directive Usage
❌ Bad:
```javascript
// app/users/[id]/page.js
import { useState } from 'react'  // Error: Can't import client hooks in server component

export default function UserPage({ params }) {
  const [count, setCount] = useState(0)  // Error: Can't use hooks in server component
  return <div>User {params.id}</div>
}
```

✅ Good:
```javascript
// app/users/[id]/page.js
import UserProfile from './user-profile'

export default async function UserPage({ params }) {
  const user = await getUser(params.id)
  return <UserProfile user={user} />
}

// app/users/[id]/user-profile.js
'use client'
import { useState } from 'react'

export default function UserProfile({ user }) {
  const [count, setCount] = useState(0)  // OK: Client component
  return <div>{user.name}</div>
}
```

## Monitoring and Observability

### Error Boundaries
```javascript
// app/error.js
'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('App Router Error:', error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Performance Monitoring
```javascript
// utils/performance-monitor.js
export class PerformanceMonitor {
  static measureNavigation() {
    if (typeof performance !== 'undefined') {
      performance.mark('navigation-start')

      // Measure various performance metrics
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.duration}ms`)
        }
      })

      observer.observe({ entryTypes: ['navigation', 'paint'] })
    }
  }
}
```

## Recovery Procedures

### Clear Next.js Cache
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Reset App Directory
```bash
# If experiencing persistent routing issues
# 1. Stop the development server
# 2. Clear cache
rm -rf .next
# 3. Clear node_modules if needed
rm -rf node_modules
npm install
# 4. Restart development server
npm run dev
```

These troubleshooting patterns will help diagnose and resolve common Next.js App Router issues effectively.