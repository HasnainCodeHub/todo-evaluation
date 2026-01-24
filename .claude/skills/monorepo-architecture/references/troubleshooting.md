# Monorepo Architecture Troubleshooting Guide

## Common Issues and Solutions

### 1. Dependency Resolution Problems
**Problem**: Packages can't find each other or have version conflicts
**Symptoms**: "Module not found", "Cannot resolve", "Version mismatch" errors
**Solutions**:
- Verify workspace protocol usage: `@my-org/package: "workspace:*"`
- Check pnpm-workspace.yaml for correct package inclusion
- Ensure proper package naming conventions
- Clear node_modules and reinstall dependencies

```bash
# Clear and reinstall dependencies
rm -rf node_modules
rm -rf apps/*/node_modules packages/*/node_modules
pnpm install
```

### 2. Build Order Issues
**Problem**: Packages fail to build due to missing dependencies
**Symptoms**: "Cannot find module", "Build failed", "Dependency not found"
**Solutions**:
- Define proper build dependencies in package.json
- Use Nx target dependencies for complex build orders
- Implement incremental builds
- Check for circular dependencies

```json
// nx.json - Define build dependencies
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 3. TypeScript Path Resolution
**Problem**: TypeScript can't resolve path aliases
**Symptoms**: "Cannot find module", "TS2307" errors
**Solutions**:
- Verify baseUrl in tsconfig.json
- Check path mappings in compiler options
- Ensure tsconfig references are correct
- Use consistent path conventions

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@my-org/shared/*": ["packages/shared/src/*"],
      "@my-org/ui/*": ["packages/ui/src/*"]
    }
  }
}
```

### 4. Performance Issues
**Problem**: Slow builds, long startup times, poor development experience
**Symptoms**: "Build takes too long", "Hot reload is slow", "Commands hang"
**Solutions**:
- Implement selective building with Nx affected
- Use build caching
- Optimize dependency installation
- Consider code splitting for large applications

## Debugging Steps

### Step 1: Verify Workspace Configuration
```bash
# Check workspace configuration
pnpm config list
pnpm workspaces list

# Verify workspace packages are recognized
cat pnpm-workspace.yaml
pnpm list --depth=0
```

### Step 2: Check Dependency Links
```bash
# Check if workspace packages are properly linked
pnpm why @my-org/shared-package

# Verify symbolic links exist
ls -la node_modules/@my-org/

# Check for duplicate dependencies
pnpm dedupe --dry-run
```

### Step 3: Test Individual Package Builds
```bash
# Build packages individually to isolate issues
pnpm --filter=@my-org/shared-package build
pnpm --filter=@my-org/frontend build
pnpm --filter=@my-org/backend build
```

### Step 4: Validate TypeScript Configuration
```bash
# Check TypeScript compilation
npx tsc --noEmit --project packages/shared/tsconfig.json
npx tsc --noEmit --project apps/frontend/tsconfig.json
npx tsc --noEmit --project apps/backend/tsconfig.json
```

## Error Messages and Solutions

### "Cannot resolve dependency"
**Cause**: Package dependency not properly configured
**Solutions**:
- Check if package is published locally with `workspace:*`
- Verify package name matches exactly
- Ensure package is included in workspace configuration
- Check for typos in import statements

### "Module not found"
**Cause**: TypeScript path resolution or package linking issue
**Solutions**:
- Verify tsconfig.json paths configuration
- Check if package is built (dist files exist)
- Ensure workspace links are properly created
- Restart TypeScript server in IDE

### "Circular dependency detected"
**Cause**: Two or more packages depend on each other
**Solutions**:
- Move shared code to a separate package
- Create interfaces/abstractions to break cycles
- Restructure dependencies to be unidirectional
- Use dependency inversion principle

### "Build takes too long"
**Cause**: Inefficient build configuration or dependencies
**Solutions**:
- Implement incremental builds
- Use build caching
- Optimize TypeScript compilation
- Parallelize builds where possible

### "Commands hang or freeze"
**Cause**: Memory issues, file watcher problems, or infinite loops
**Solutions**:
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- Check file watcher limits on Linux/Mac
- Disable unnecessary watchers during CI
- Check for infinite loops in build scripts

## Development vs Production Differences

### Environment Configuration
```json
// package.json - Environment-specific scripts
{
  "scripts": {
    "dev": "NODE_ENV=development nx serve",
    "build": "NODE_ENV=production nx build",
    "build:staging": "NODE_ENV=staging nx build",
    "preview": "NODE_ENV=production nx preview"
  }
}
```

### Debug Logging
```bash
# Enable debug logging for pnpm
pnpm install --reporter=silent --debug

# Enable verbose logging for Nx
nx build --verbose

# Debug TypeScript path resolution
npx tsc --traceResolution
```

## Testing Monorepo Architecture

### Unit Tests for Monorepo Structure
```typescript
// tests/monorepo-structure.test.ts
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Monorepo Structure', () => {
  test('workspace configuration is valid', () => {
    const workspaceConfig = join(process.cwd(), 'pnpm-workspace.yaml');
    expect(existsSync(workspaceConfig)).toBe(true);

    // Check if pnpm recognizes workspaces
    const workspaces = execSync('pnpm workspaces list --json', { encoding: 'utf-8' });
    const workspaceList = JSON.parse(workspaces);
    expect(Array.isArray(workspaceList)).toBe(true);
    expect(workspaceList.length).toBeGreaterThan(0);
  });

  test('all expected packages exist', () => {
    const expectedPackages = ['frontend', 'backend', 'shared'];
    const packagesDir = join(process.cwd(), 'packages');

    if (existsSync(packagesDir)) {
      const actualPackages = readdirSync(packagesDir);
      expectedPackages.forEach(pkg => {
        expect(actualPackages).toContain(pkg);
      });
    }
  });

  test('package dependencies are properly configured', () => {
    // Test that workspace dependencies are properly set
    const frontendPackage = require(join(process.cwd(), 'apps', 'frontend', 'package.json'));
    expect(frontendPackage.dependencies['@my-org/shared']).toMatch(/^workspace:/);
  });
});
```

### Integration Tests
```typescript
// tests/dependency-resolution.test.ts
import { execSync } from 'child_process';
import { join } from 'path';

describe('Dependency Resolution', () => {
  test('can import shared package in frontend', () => {
    // Create a temporary test file to verify imports work
    const testFile = `
      import { SharedUtil } from '@my-org/shared';
      console.log('Import successful');
    `;

    // Write and execute test
    const tempDir = join(process.cwd(), 'temp-test');
    // ... implementation to test import resolution
  });

  test('build succeeds with all dependencies', () => {
    try {
      execSync('pnpm --filter=@my-org/frontend build', { stdio: 'pipe' });
      // If no error, build succeeded
      expect(true).toBe(true);
    } catch (error) {
      console.error('Build failed:', error.stdout?.toString() || error.message);
      expect(false).toBe(true); // Will fail the test
    }
  });
});
```

## Performance Debugging

### Build Performance Analysis
```bash
# Profile build performance
pnpm build --profile

# Analyze Nx performance
nx build --profile=events.json
# Then analyze events.json with Chrome DevTools

# Check dependency graph
nx dep-graph --file=dep-graph.json
```

### Memory Usage Monitoring
```bash
# Monitor during builds
node --inspect-brk --max-old-space-size=8192 $(which pnpm) build

# Or use a memory monitoring script
const v8 = require('v8');
const fs = require('fs');

function logMemoryUsage() {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`,
  });
}

// Call before and after operations
logMemoryUsage();
// ... operation
logMemoryUsage();
```

## Security Troubleshooting

### Dependency Security Issues
```bash
# Check for vulnerable dependencies across monorepo
pnpm audit

# Check specific packages
pnpm --filter=@my-org/frontend audit
pnpm --filter=@my-org/backend audit

# Check for outdated packages
pnpm outdated --recursive
```

### Permission Issues
```bash
# Fix permission issues in monorepo
chmod -R 755 node_modules
chmod -R 755 apps/*/node_modules packages/*/node_modules

# Check for EACCES errors during installation
# Usually fixed by clearing cache and reinstalling
pnpm store prune
pnpm install
```

## Common Misconfigurations

### Incorrect Workspace Setup
❌ Bad:
```yaml
# ❌ Wrong: Not using proper glob patterns
packages:
  - packages/*
  - apps/*
```

✅ Good:
```yaml
# ✅ Correct: Using globstar patterns
packages:
  - 'packages/**'
  - 'apps/**'
  - '!**/test/**'  # Exclude test directories
```

### Improper Dependency Management
❌ Bad:
```json
// ❌ Wrong: Using version numbers for workspace packages
{
  "dependencies": {
    "@my-org/shared": "0.1.0"  // Should use workspace protocol
  }
}
```

✅ Good:
```json
// ✅ Correct: Using workspace protocol
{
  "dependencies": {
    "@my-org/shared": "workspace:*"
  }
}
```

### Circular Dependencies
❌ Bad:
```typescript
// packages/a/src/index.ts
import { BFunction } from '@my-org/b';  // A depends on B

// packages/b/src/index.ts
import { AFunction } from '@my-org/a';  // B depends on A - CIRCULAR!
```

✅ Good:
```typescript
// packages/shared/src/common-types.ts - New package to break cycle
export interface CommonInterface { ... }

// packages/a/src/index.ts
import { CommonInterface } from '@my-org/shared';

// packages/b/src/index.ts
import { CommonInterface } from '@my-org/shared';
```

## Monitoring and Observability

### Build Metrics
```bash
# Create a build metrics script
const fs = require('fs');
const { execSync } = require('child_process');

function collectBuildMetrics() {
  const startTime = Date.now();

  try {
    execSync('pnpm build', { stdio: 'inherit' });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Build completed in ${duration}ms`);

    // Log metrics to file
    const metrics = {
      timestamp: new Date().toISOString(),
      duration,
      success: true
    };

    fs.appendFileSync('build-metrics.json', JSON.stringify(metrics) + '\n');
  } catch (error) {
    console.error('Build failed:', error.message);

    const metrics = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      success: false,
      error: error.message
    };

    fs.appendFileSync('build-metrics.json', JSON.stringify(metrics) + '\n');
  }
}

collectBuildMetrics();
```

### Dependency Graph Validation
```bash
# Validate dependency graph
nx graph --file=dep-graph.json

# Check for forbidden dependencies
nx affected --target=dep-graph --file=affected-deps.json

# Generate visualization
nx graph --file=graph.html
```

## Performance Optimization

### Incremental Build Configuration
```json
// nx.json - Optimize for incremental builds
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "runtimeCacheInputs": ["node -v"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "outputs": ["{projectRoot}/dist", "{projectRoot}/build"]
    }
  }
}
```

### Selective Operations
```bash
# Only build affected projects
nx affected --target=build --base=main~1

# Only test affected projects
nx affected --target=test --base=HEAD~1

# Only lint changed files
nx affected --target=lint --files=changed-file.ts

# Build specific project and its dependencies
nx build @my-org/frontend --with-deps
```

## CI/CD Troubleshooting

### GitHub Actions Issues
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8.x
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'  # Enable caching

      - name: Install dependencies
        run: pnpm install --frozen-lockfile  # Ensure reproducible builds

      - name: Lint
        run: pnpm lint

      - name: Test affected projects only
        run: nx affected --target=test --base=origin/main --parallel=3
```

### Cache Management
```bash
# Clear specific cache
pnpm store path  # Show store path
pnpm store prune  # Remove unreferenced packages

# Nx cache operations
nx reset  # Clear all Nx cache
nx cache  # Show cache info
nx build --skip-nx-cache  # Skip cache for this run
```

## Recovery Procedures

### Complete Reset
```bash
#!/bin/bash
# reset-monorepo.sh

echo "Resetting monorepo..."

# Remove all generated files
rm -rf node_modules
rm -rf apps/*/node_modules packages/*/node_modules
rm -rf apps/*/dist packages/*/dist
rm -rf apps/*/build packages/*/build
rm -rf .nx
rm -rf coverage

# Clear pnpm store
pnpm store prune

# Clear Nx cache
nx reset

# Reinstall
pnpm install

# Verify workspace
pnpm workspaces list

echo "Monorepo reset complete!"
```

### Package Recovery
```bash
#!/bin/bash
# recover-package.sh

PACKAGE_NAME=$1
if [ -z "$PACKAGE_NAME" ]; then
  echo "Usage: $0 <package-name>"
  exit 1
fi

echo "Recovering package: $PACKAGE_NAME"

# Remove specific package node_modules
rm -rf "packages/$PACKAGE_NAME/node_modules" "packages/$PACKAGE_NAME/dist"

# Reinstall dependencies for this package
pnpm --filter="@my-org/$PACKAGE_NAME" install

# Build the package
pnpm --filter="@my-org/$PACKAGE_NAME" build

echo "Package $PACKAGE_NAME recovered!"
```