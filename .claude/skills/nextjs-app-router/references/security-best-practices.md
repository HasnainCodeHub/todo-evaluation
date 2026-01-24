# Next.js App Router Security Best Practices

## Server Component Security

### Input Validation and Sanitization
```javascript
// ✅ Secure: Validate and sanitize inputs in server components
// app/users/[id]/page.js
import { validateUserId } from '@/lib/validation'

export default async function UserPage({ params }) {
  // Validate dynamic route parameter
  if (!validateUserId(params.id)) {
    return <div>Invalid user ID</div>
  }

  const user = await getUser(params.id)

  if (!user) {
    return <div>User not found</div>
  }

  return <UserProfile user={user} />
}

// lib/validation.js
export function validateUserId(id) {
  // Validate that ID is a positive integer
  return /^\d+$/.test(id) && parseInt(id) > 0
}
```

### Safe Data Fetching
```javascript
// ✅ Secure: Use safe fetch methods with validation
// lib/safe-api.js
const ALLOWED_ENDPOINTS = [
  'https://api.example.com',
  'https://cdn.example.com'
]

export async function safeFetch(endpoint, options = {}) {
  // Validate endpoint is allowed
  const url = new URL(endpoint, 'https://api.example.com')

  if (!ALLOWED_ENDPOINTS.some(allowed => url.origin === new URL(allowed).origin)) {
    throw new Error('Blocked fetch to disallowed domain')
  }

  return fetch(url.toString(), options)
}

// app/data-fetcher.js
export async function fetchData(path) {
  // Validate path to prevent path traversal
  if (path.includes('..') || path.includes('//')) {
    throw new Error('Invalid path')
  }

  const response = await safeFetch(`/api/${path}`)
  return response.json()
}
```

## Client Component Security

### Sanitizing Dynamic Content
```javascript
// ✅ Secure: Sanitize HTML content in client components
'use client'

import DOMPurify from 'isomorphic-dompurify'

export default function ContentRenderer({ htmlContent }) {
  // Sanitize HTML to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: []
  })

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  )
}
```

### Secure Form Handling
```javascript
// ✅ Secure: Client-side form validation with server validation
'use client'

import { useState } from 'react'

export default function SecureForm() {
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  })
  const [errors, setErrors] = useState({})

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) ? null : 'Invalid email format'
      case 'message':
        if (value.length > 1000) return 'Message too long'
        if (/<script/i.test(value)) return 'Invalid content'
        return null
      default:
        return null
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Validate as user types
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all fields before submission
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit to server
    try {
      await submitForm(formData)
    } catch (error) {
      console.error('Submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className={errors.email ? 'error' : ''}
      />
      {errors.email && <span className="error">{errors.email}</span>}

      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        className={errors.message ? 'error' : ''}
      />
      {errors.message && <span className="error">{errors.message}</span>}

      <button type="submit">Submit</button>
    </form>
  )
}
```

## Route Security

### Route Parameter Validation
```javascript
// ✅ Secure: Validate dynamic route parameters
// app/products/[slug]/page.js
import { validateSlug } from '@/lib/validation'

export default async function ProductPage({ params }) {
  if (!validateSlug(params.slug)) {
    return <div>Invalid product slug</div>
  }

  const product = await getProductBySlug(params.slug)

  if (!product) {
    return <div>Product not found</div>
  }

  return <ProductDetail product={product} />
}

// lib/validation.js
export function validateSlug(slug) {
  // Allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(slug) && slug.length <= 100
}
```

### Private Route Protection
```javascript
// ✅ Secure: Protect private routes with server-side authentication
// lib/auth.js
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function getCurrentUser() {
  const token = cookies().get('auth_token')

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )
    return verified.payload
  } catch {
    return null
  }
}

// app/dashboard/page.js
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    // Redirect to login if not authenticated
    redirect('/login')
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
    </div>
  )
}
```

## Middleware Security

### Authentication Middleware
```javascript
// ✅ Secure: Middleware for route protection
// middleware.js
import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Public routes
  const publicPaths = ['/login', '/register', '/api/auth', '/api/public']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check authentication
  const token = request.cookies.get('auth_token')

  if (!token) {
    // Redirect to login for protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?callbackUrl=${encodeURIComponent(request.url)}`
      return NextResponse.redirect(url)
    }
  }

  // Validate token if present
  if (token) {
    try {
      // Verify token validity
      const isValid = await verifyToken(token.value)
      if (!isValid) {
        // Clear invalid token and redirect
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth_token')
        return response
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/login',
    '/register'
  ],
}
```

## Data Protection

### Secure Data Handling
```javascript
// ✅ Secure: Protect sensitive data in components
// components/user-profile.js
export default function UserProfile({ user }) {
  // Don't expose sensitive data to client
  const {
    id,
    name,
    email,
    // Don't pass sensitive data like password, tokens, etc.
    password, // ❌ Never pass sensitive data
    ...safeUserProps
  } = user

  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  )
}

// app/users/[id]/page.js
export default async function UserPage({ params }) {
  const user = await getUser(params.id)

  // Strip sensitive data before passing to client component
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email
    // Don't include password, tokens, etc.
  }

  return <UserProfile user={safeUser} />
}
```

## Content Security Policy (CSP)

### CSP Configuration
```javascript
// ✅ Secure: Configure CSP headers
// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()

  // Set Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://www.google-analytics.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none'; " +
    "object-src 'none';"
  )

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Environment Security

### Secure Environment Handling
```javascript
// ✅ Secure: Handle environment variables securely
// lib/config.js
export const getConfig = () => {
  // Validate required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_API_BASE_URL'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  return {
    // Public config (safe to expose to client)
    public: {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    },
    // Private config (server-side only)
    private: {
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
    }
  }
}

// Never expose private config to client components
export function getPublicConfig() {
  const config = getConfig()
  return config.public
}
```

## File Upload Security

### Secure File Handling
```javascript
// ✅ Secure: Handle file uploads safely
// app/api/upload/route.js
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf'
]

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    // Validate file type (this can be spoofed, so also validate after upload)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Generate secure filename
    const fileExtension = path.extname(file.name)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // Save file securely
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Additional validation: Check file magic bytes
    if (!isValidFileType(fileBuffer, fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    await fs.writeFile(filePath, fileBuffer)

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename: fileName
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

function isValidFileType(buffer, extension) {
  // Check file magic bytes to validate actual file type
  const jpegMagic = Buffer.from([0xFF, 0xD8, 0xFF])
  const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47])
  const gifMagic = Buffer.from([0x47, 0x49, 0x46])

  if (extension === '.jpg' || extension === '.jpeg') {
    return buffer.slice(0, 3).equals(jpegMagic)
  }
  if (extension === '.png') {
    return buffer.slice(0, 4).equals(pngMagic)
  }
  if (extension === '.gif') {
    return buffer.slice(0, 3).equals(gifMagic)
  }
  if (extension === '.pdf') {
    return buffer.slice(0, 4).compare(Buffer.from('%PDF')) === 0
  }

  return false
}
```

## Logging Security

### Secure Logging
```javascript
// ✅ Secure: Log securely without exposing sensitive data
// lib/logger.js
import { createLogger, transports, format } from 'winston'

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/app.log' }),
    new transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
})

export function logRequest(req, res, next) {
  // Sanitize request data before logging
  const sanitizedReq = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    timestamp: new Date().toISOString()
  }

  logger.info('Request', sanitizedReq)
  next()
}

// Never log sensitive data
export function secureLog(level, message, data = {}) {
  // Remove sensitive information
  const sanitizedData = { ...data }
  delete sanitizedData.password
  delete sanitizedData.token
  delete sanitizedData.jwt

  logger[level](message, sanitizedData)
}
```

## Security Headers Configuration

### Complete Security Headers
```javascript
// app/middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://www.google-analytics.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  )

  // HTTP Strict Transport Security
  response.headers.set('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set('Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Security Testing

### Automated Security Tests
```javascript
// tests/security.test.js
import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  test('should have proper CSP headers', async ({ page }) => {
    const response = await page.goto('/')
    const cspHeader = response.headers()['content-security-policy']

    expect(cspHeader).toBeDefined()
    expect(cspHeader).toContain('default-src \'self\'')
  })

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response.headers()

    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
  })
})

test.describe('Input Validation', () => {
  test('should validate route parameters', async ({ request }) => {
    const response = await request.get('/users/../../../etc/passwd')
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })

  test('should sanitize HTML content', async ({ page }) => {
    // Test that malicious scripts are sanitized
    await page.route('**/api/content', route => {
      route.fulfill({
        status: 200,
        body: '{"content": "<script>alert(\'xss\')</script>Safe content"}'
      })
    })

    await page.goto('/content')
    // Verify script was sanitized
    await expect(page.locator('text=alert')).not.toBeVisible()
  })
})
```

## Security Policies

### Security Checklist
```markdown
# Next.js App Router Security Checklist

## Before deploying to production:

### Authentication & Authorization
- [ ] User authentication implemented server-side
- [ ] Route protection with middleware
- [ ] Session management secure
- [ ] JWT tokens properly secured
- [ ] Password hashing implemented

### Input Validation
- [ ] All route parameters validated
- [ ] Form inputs validated and sanitized
- [ ] File uploads validated and scanned
- [ ] SQL injection prevented
- [ ] NoSQL injection prevented

### Content Security
- [ ] Content Security Policy implemented
- [ ] XSS prevention implemented
- [ ] HTML content sanitized
- [ ] Client-side validation complemented by server-side validation
- [ ] Unsafe inline styles/scripts avoided

### Headers & Configuration
- [ ] Security headers configured
- [ ] HSTS enabled
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer Policy configured

### Data Protection
- [ ] Sensitive data not exposed to client
- [ ] Environment variables secure
- [ ] Database connections secure
- [ ] API keys protected
- [ ] Error messages don't leak information

### Monitoring
- [ ] Security events logged appropriately
- [ ] No sensitive data in logs
- [ ] Error handling doesn't expose internals
- [ ] Performance monitoring in place
```

These security practices ensure that your Next.js App Router application remains secure throughout its lifecycle while maintaining the benefits of modern server and client component architecture.