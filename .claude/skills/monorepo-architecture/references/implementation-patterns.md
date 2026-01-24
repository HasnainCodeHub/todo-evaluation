# Monorepo Architecture Implementation Patterns

## Directory Structure Patterns

### Standard Full-Stack Monorepo
```
todo-app-monorepo/
├── apps/
│   ├── frontend/              # Next.js frontend application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   └── backend/               # FastAPI backend application
│       ├── src/
│       │   ├── routers/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── database/
│       │   └── utils/
│       ├── tests/
│       ├── requirements.txt
│       ├── pyproject.toml
│       └── Dockerfile
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   │   ├── types/
│   │   ├── index.ts
│   │   └── package.json
│   ├── ui-components/         # Reusable UI components
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api-client/            # API client library
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── specs/                     # Spec-Kit Plus specifications
│   ├── auth/
│   ├── tasks/
│   └── user/
├── .claude/                   # Claude Code configuration
│   ├── skills/
│   └── agents/
├── scripts/                   # Utility scripts
│   ├── setup.sh
│   └── deploy.sh
├── configs/                   # Shared configurations
│   ├── eslint/
│   └── prettier/
├── .gitignore
├── pnpm-workspace.yaml        # PNPM workspace configuration
├── package.json              # Root package configuration
├── pyproject.toml            # Python project configuration
├── README.md
└── CLAUDE.md                 # Claude Code instructions
```

### Micro-Frontends with Shared Backend
```
micro-frontend-monorepo/
├── apps/
│   ├── customer-portal/      # Customer-facing application
│   ├── admin-panel/          # Administrative panel
│   ├── marketing-site/       # Marketing website
│   └── backend/             # Shared backend API
├── packages/
│   ├── shared-ui/           # Shared UI components
│   ├── shared-logic/        # Business logic shared across apps
│   ├── shared-config/       # Shared configuration
│   └── auth-lib/            # Authentication library
├── libs/                    # Internal libraries
│   ├── data-access/         # Data access patterns
│   └── validation/          # Validation utilities
├── tools/                   # Development tools
│   ├── generators/          # Code generators
│   └── linters/             # Linting tools
├── pnpm-workspace.yaml
├── nx.json                  # Nx configuration
└── package.json
```

## Package Management Patterns

### PNPM Workspace Configuration
**pnpm-workspace.yaml:**
```yaml
packages:
  # Include all apps and packages
  - 'apps/**'
  - 'packages/**'
  - 'libs/**'
  # Exclude test and build directories
  - '!**/test/**'
  - '!**/__tests__/**'
  - '!**/dist/**'
  - '!**/build/**'
```

### Root package.json with Workspace Scripts
```json
{
  "name": "todo-monorepo",
  "private": true,
  "scripts": {
    "dev": "nx run-many --target=dev --all",
    "build": "nx run-many --target=build --all",
    "build:frontend": "nx run frontend:build",
    "build:backend": "nx run backend:build",
    "test": "nx run-many --target=test --all",
    "test:affected": "nx affected --target=test",
    "lint": "nx run-many --target=lint --all",
    "format": "prettier --write .",
    "clean": "rm -rf node_modules && rm -rf apps/*/node_modules && rm -rf packages/*/node_modules",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@nx/workspace": "16.0.0",
    "nx": "16.0.0",
    "prettier": "^2.8.0",
    "husky": "^8.0.0",
    "@commitlint/cli": "^17.0.0",
    "@commitlint/config-conventional": "^17.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Dependency Management Patterns

### Cross-Package Dependencies
```json
// apps/frontend/package.json
{
  "name": "@todo-app/frontend",
  "version": "0.0.1",
  "dependencies": {
    "@todo-app/shared-types": "workspace:*",
    "@todo-app/api-client": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/node": "^18.0.0"
  }
}
```

```json
// packages/shared-types/package.json
{
  "name": "@todo-app/shared-types",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist/**"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

## Build Pipeline Patterns

### Nx Target Configuration
**nx.json:**
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default"
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist", "{projectRoot}/build"]
    },
    "test": {
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "inputs": ["default", "^default"]
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": [],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ]
  }
}
```

### Build Script Patterns
```bash
#!/bin/bash
# scripts/build-all.sh

set -e

echo "Building monorepo..."

# Build shared packages first
echo "Building shared packages..."
pnpm --filter="./packages/*" build

# Build backend
echo "Building backend..."
pnpm --filter="./apps/backend" build

# Build frontend (depends on backend being built)
echo "Building frontend..."
pnpm --filter="./apps/frontend" build

echo "Build completed successfully!"
```

## Development Workflow Patterns

### Concurrent Development Setup
```json
// package.json (root)
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:frontend\" \"pnpm dev:backend\"",
    "dev:frontend": "pnpm --filter=@todo-app/frontend dev",
    "dev:backend": "pnpm --filter=@todo-app/backend dev",
    "dev:shared": "pnpm --filter=@todo-app/shared-types dev"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### Hot Module Replacement Configuration
**apps/frontend/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Enable Turbo Pack for faster builds
    }
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configure for monorepo development
      config.resolve.symlinks = false;
    }
    return config;
  },
};

module.exports = nextConfig;
```

## Testing Patterns

### Cross-Package Testing
```json
// package.json (root)
{
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run --typecheck.enabled=false",
    "test:integration": "vitest run --config vitest.integrations.config.ts",
    "test:affected": "nx affected --target=test --parallel=3"
  }
}
```

### Vitest Configuration for Monorepo
**vitest.shared.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import { join } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/e2e/**'
    ],
    alias: {
      '@todo-app/shared-types': join(__dirname, 'packages/shared-types/src'),
      '@todo-app/api-client': join(__dirname, 'packages/api-client/src')
    }
  }
});
```

## Environment Configuration

### Shared Environment Management
```
.env.example              # Template for environment variables
.env.development          # Development environment
.env.staging             # Staging environment
.env.production          # Production environment
```

### Per-App Configuration
```typescript
// packages/shared-config/src/env.ts
interface AppConfig {
  apiUrl: string;
  authUrl: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
}

export const getAppConfig = (): AppConfig => {
  return {
    apiUrl: process.env.API_URL || 'http://localhost:8000',
    authUrl: process.env.AUTH_URL || 'http://localhost:8000/auth',
    environment: (process.env.NODE_ENV as any) || 'development',
    debug: process.env.DEBUG === 'true'
  };
};
```

## Code Generation Patterns

### Nx Generator Configuration
**tools/generators/component/index.ts:**
```typescript
import {
  Tree,
  formatFiles,
  installPackagesTask,
  generateFiles,
  names,
  joinPathFragments,
  offsetFromRoot
} from '@nx/devkit';
import * as path from 'path';

interface ComponentGeneratorOptions {
  name: string;
  directory: string;
  style: 'css' | 'scss' | 'styled-components';
}

export default async function (tree: Tree, options: ComponentGeneratorOptions) {
  const componentNames = names(options.name);
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${componentNames.fileName}`
    : componentNames.fileName;

  const projectDestination = joinPathFragments(
    'packages/ui/src/components',
    projectDirectory
  );

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectDestination,
    {
      ...options,
      ...componentNames,
      projectDirectory,
      offsetFromRoot: offsetFromRoot(projectDestination),
    }
  );

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
```

## Deployment Patterns

### Multi-App Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy Monorepo

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter=./apps/frontend build

      - name: Deploy to Vercel
        run: |
          npx vercel deploy ./apps/frontend/dist --prod

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - run: pip install poetry
      - run: poetry install --only=main
      - run: poetry run python -m build

      - name: Deploy to Heroku
        run: |
          # Heroku deployment logic
```

## Containerization Patterns

### Docker Compose for Development
**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
    environment:
      - API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./apps/backend:/app
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Performance Optimization Patterns

### Selective Building
```json
// nx.json - Selective build configuration
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    }
  }
}
```

### Smart Caching
```bash
# scripts/cache-build.sh
#!/bin/bash

# Calculate hash of dependencies to bust cache when needed
DEPENDENCY_HASH=$(find packages shared -name "package.json" -exec cat {} \; | shasum -a 256 | cut -d' ' -f1)

BUILD_CACHE_KEY="build-${DEPENDENCY_HASH}"

# Use cache key for CI/CD
echo "Using cache key: $BUILD_CACHE_KEY"
```

## Tool Integration Patterns

### Prettier Configuration
**.prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

**.prettierignore:**
```
node_modules
dist
build
.next
.nx
```

### ESLint Configuration for Monorepo
**.eslintrc.js:**
```javascript
module.exports = {
  root: true,
  extends: ['@my-org/eslint-config'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['packages', 'shared'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
    },
  ],
};
```

## Spec-Kit Plus Integration

### Specs Directory Organization
```
specs/
├── auth/                 # Authentication feature specs
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
├── tasks/               # Task management feature specs
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
├── user/                # User management feature specs
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
└── global/              # Global architecture specs
    ├── monorepo.md
    └── security.md
```

### Claude Code Integration
**CLAUDE.md:**
```markdown
# Claude Code Instructions for Monorepo

## Context Loading
- Frontend context: `apps/frontend/**/*`
- Backend context: `apps/backend/**/*`
- Shared context: `packages/shared/**/*`

## Project Structure
- Frontend: Next.js application in `apps/frontend`
- Backend: FastAPI application in `apps/backend`
- Shared types: TypeScript definitions in `packages/shared-types`
- UI Components: Reusable components in `packages/ui-components`

## Development Workflow
- Use `pnpm dev` for development
- Use `pnpm build` for production builds
- Use `pnpm test` for running tests
```

These patterns provide a solid foundation for implementing effective monorepo architectures that scale with your project needs while maintaining clear boundaries and efficient development workflows.