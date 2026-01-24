# Monorepo Architecture Security Best Practices

## Repository Structure Security

### Access Control
```yaml
# .github/access-control.yml
# Define granular access control for different parts of the monorepo
repositories:
  my-monorepo:
    teams:
      frontend-team:
        access:
          - "apps/frontend/**/*"
          - "packages/ui-components/**/*"
        permissions: "read-write"

      backend-team:
        access:
          - "apps/backend/**/*"
          - "packages/shared-types/**/*"
        permissions: "read-write"

      devops-team:
        access:
          - "**/Dockerfile"
          - "**/docker-compose.yml"
          - "**/infrastructure/**/*"
          - "**/deployments/**/*"
        permissions: "read-write"

    # Read-only access for all members
    default_permissions: "read"
```

### Branch Protection
```yaml
# .github/branch-protection.yml
branches:
  - name: main
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 2
        dismiss_stale_reviews: true
      required_status_checks:
        strict: true
        contexts:
          - "build-frontend"
          - "build-backend"
          - "test-frontend"
          - "test-backend"
          - "security-scan"
      restrictions:
        users: []
        teams: ["maintainers"]
```

## Dependency Security

### Dependency Management Security
```json
// package.json - Security-focused configuration
{
  "scripts": {
    "security:check": "pnpm audit --audit-level high",
    "security:check-all": "pnpm --recursive audit --audit-level moderate",
    "security:update": "pnpm update --interactive",
    "security:lockfile-check": "pnpm audit --lockfile-only"
  },
  "pnpm": {
    "auditConfig": {
      "registry": "https://registry.npmjs.org/"
    }
  }
}
```

### Automated Security Scanning
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly security scan

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run dependency security audit
        run: |
          pnpm audit --audit-level moderate
          if [ $? -ne 0 ]; then
            echo "Security vulnerabilities found!"
            exit 1
          fi

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2
```

## Secrets Management

### Environment Variable Security
```bash
# .env.example - Template without actual values
# Frontend environment variables
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SENTRY_DSN=

# Backend environment variables
DATABASE_URL=
JWT_SECRET=
REDIS_URL=
SMTP_PASSWORD=
```

### Secrets in Code
```typescript
// ❌ Never hardcode secrets in code
const apiKey = "sk-actual-secret-key"; // DANGEROUS!

// ✅ Use environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable is required");
}

// ✅ Validate secrets at startup
function validateSecrets() {
  const requiredSecrets = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      throw new Error(`Required secret ${secret} is not set`);
    }
  }
}
```

### Secure Configuration Management
```typescript
// packages/config/src/security.ts
interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  databaseUrl: string;
}

export class SecureConfig {
  static load(): SecurityConfig {
    // Validate that secrets are not empty or default values
    const secrets = {
      jwtSecret: process.env.JWT_SECRET,
      encryptionKey: process.env.ENCRYPTION_KEY,
      databaseUrl: process.env.DATABASE_URL
    };

    Object.entries(secrets).forEach(([key, value]) => {
      if (!value || value.trim() === '' || value === 'YOUR_SECRET_HERE') {
        throw new Error(`Invalid or missing secret: ${key}`);
      }
    });

    return secrets as SecurityConfig;
  }
}
```

## Package Security

### Workspace Package Security
```json
// packages/shared/package.json - Secure package configuration
{
  "name": "@my-org/shared",
  "version": "0.0.1",
  "private": false,
  "publishConfig": {
    "access": "restricted"
  },
  "files": [
    "dist/**",
    "!**/*.test.*",
    "!**/__tests__/**",
    "!**/node_modules/**"
  ],
  "scripts": {
    "prepack": "npm run build && npm run security:scan",
    "security:scan": "npm audit --audit-level moderate"
  }
}
```

### Private Package Management
```yaml
# .npmrc - Private registry configuration
@my-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Build Security

### Secure Build Configuration
```typescript
// apps/frontend/next.config.js - Secure build configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },

  // Prevent inclusion of sensitive files
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't allow importing .env files
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### Build Pipeline Security
```yaml
# .github/workflows/secure-build.yml
name: Secure Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  secure-build:
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          persist-credentials: false

      - name: Setup PNPM
        uses: pnpm/action-setup@v2

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      # Verify no secrets are hardcoded in code
      - name: Secret scanning
        run: |
          if grep -r "secret\|password\|key\|token\|credential" . --exclude-dir=node_modules | grep -v ".env.example" | grep -v "README.md"; then
            echo "Potential secrets found in code!"
            exit 1
          fi

      - name: Install dependencies securely
        run: pnpm install --frozen-lockfile --ignore-scripts=false
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Build
        run: pnpm build
        env:
          NODE_ENV: production
```

## Network Security

### API Security
```typescript
// apps/backend/src/middleware/security.ts
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
}
```

### CORS Configuration
```typescript
// apps/backend/src/config/cors.ts
import cors from 'cors';

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://my-app.com', 'https://admin.my-app.com']
  : ['http://localhost:3000', 'http://localhost:3001'];

export const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};

export const corsMiddleware = cors(corsOptions);
```

## Container Security

### Secure Docker Configuration
```dockerfile
# apps/backend/Dockerfile
FROM node:18-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nextjs:nodejs package.json pnpm-lock.yaml ./
COPY --chown=nextjs:nodejs pnpm-workspace.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm fetch --frozen-lockfile
RUN pnpm install --frozen-lockfile --offline

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build the application
RUN pnpm --filter=backend build

# Production stage
FROM node:18-alpine AS runner
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=base --chown=nextjs:nodejs /app/apps/backend/dist ./dist
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/apps/backend/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## Monitoring and Logging Security

### Secure Logging
```typescript
// packages/logging/src/secure-logger.ts
import winston from 'winston';

// Sanitize sensitive data from logs
function sanitizeLogData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function isSensitiveField(field: string): boolean {
  const sensitiveFields = [
    'password', 'secret', 'token', 'key', 'credential', 'authorization',
    'cookie', 'auth', 'jwt', 'session', 'api_key', 'private_key'
  ];
  return sensitiveFields.some(sensitive =>
    field.toLowerCase().includes(sensitive)
  );
}

export const secureLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json({ replacer: (key, value) => {
      if (key === '') return sanitizeLogData(value);
      return value;
    }})
  ),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});
```

## Supply Chain Security

### Lockfile Security
```yaml
# pnpm-lock.yaml security considerations
# Always commit lockfiles and verify integrity
# Use pnpm audit to check for vulnerabilities
# Regularly update dependencies securely
```

### Package Verification
```json
// .npmrc - Enable package integrity verification
engine-strict=true
audit=true
audit-level=moderate
```

## Incident Response

### Security Monitoring
```typescript
// packages/security-monitor/src/monitor.ts
import { EventEmitter } from 'events';

export class SecurityMonitor extends EventEmitter {
  constructor() {
    super();

    // Monitor for security-related events
    this.on('suspicious_activity', (data) => {
      console.error('SECURITY ALERT:', data);
      // Trigger incident response
    });

    this.on('unauthorized_access', (data) => {
      console.error('UNAUTHORIZED ACCESS ATTEMPT:', data);
    });
  }

  logSecurityEvent(type: string, details: any) {
    this.emit(type, {
      timestamp: new Date().toISOString(),
      type,
      details,
      source: this.getSourceInfo()
    });
  }

  private getSourceInfo() {
    // Get information about the source of the event
    return {
      ip: process.env.IP || 'unknown',
      userAgent: process.env.USER_AGENT || 'unknown',
      environment: process.env.NODE_ENV
    };
  }
}
```

## Compliance Considerations

### GDPR Compliance
```typescript
// packages/privacy/src/gdpr.ts
export class GDPRCompliance {
  // Ensure no personal data is logged or stored unnecessarily
  static ensureMinimalDataCollection(): void {
    // Configure logging to exclude personal information
    // Implement data retention policies
    // Provide data deletion capabilities
  }

  static sanitizeUserData(userData: any): any {
    // Remove or anonymize personal data that shouldn't be stored
    const sanitized = { ...userData };
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.address;
    return sanitized;
  }
}
```

### SOC 2 Compliance
```typescript
// packages/compliance/src/soc2.ts
export class SOC2Compliance {
  static ensureAccessControls(): void {
    // Implement proper access logging
    // Ensure data encryption at rest and in transit
    // Maintain audit trails
  }

  static validateSecurityControls(): boolean {
    // Validate that all security controls are in place
    return true;
  }
}
```

## Security Testing

### Automated Security Tests
```typescript
// tests/security.test.ts
import { execSync } from 'child_process';

describe('Security Tests', () => {
  test('no hardcoded secrets in codebase', () => {
    // Search for potential secrets in code
    const dangerousPatterns = [
      'secret.*=.*["\'][^"\']*["\']',
      'password.*=.*["\'][^"\']*["\']',
      'key.*=.*["\'][^"\']*["\']',
      'token.*=.*["\'][^"\']*["\']'
    ];

    for (const pattern of dangerousPatterns) {
      try {
        const result = execSync(`grep -r "${pattern}" . --exclude-dir=node_modules --exclude="*.env*"`,
          { encoding: 'utf8' });

        if (result && !result.includes('.env.example')) {
          throw new Error(`Potential secret found matching pattern: ${pattern}\n${result}`);
        }
      } catch (error) {
        // grep returns non-zero exit code if nothing is found, which is good
        if (error.message.includes('Command failed')) {
          continue; // This is expected when no matches are found
        }
        throw error;
      }
    }
  });

  test('dependencies have no critical vulnerabilities', () => {
    try {
      execSync('pnpm audit --audit-level critical', { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Critical vulnerabilities found in dependencies: ${error.stdout}`);
    }
  });
});
```

## Security Policies

### Code Review Security Checklist
```markdown
# Security Code Review Checklist

## Before merging any PR affecting the monorepo structure:

### Dependencies
- [ ] No new dependencies introduced without security review
- [ ] All dependencies have acceptable license terms
- [ ] No dependencies with known security vulnerabilities
- [ ] Dependencies are pinned to specific versions where appropriate

### Secrets Management
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly validated
- [ ] Secrets not logged or exposed in error messages
- [ ] Proper secret rotation mechanisms in place

### Access Controls
- [ ] Proper file permissions maintained
- [ ] No overly broad access grants
- [ ] Principle of least privilege followed
- [ ] Sensitive files properly restricted

### Network Security
- [ ] Proper CORS configuration
- [ ] Rate limiting implemented
- [ ] Input validation applied
- [ ] Security headers configured
```

These security practices ensure that your monorepo architecture remains secure throughout its lifecycle while maintaining the benefits of a unified codebase.