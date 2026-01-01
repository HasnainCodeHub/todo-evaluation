# Quickstart: Repository & Governance Evolution (Phase 2.0)

**Feature**: 002-repo-governance
**Date**: 2026-01-01

---

## Prerequisites

- Phase I complete (all 42 tasks, /src directory with working console app)
- Git repository initialized
- Claude Code available

## Verification Steps

After Phase 2.0 implementation, verify the following:

### 1. Directory Structure

Run from repository root:

```bash
# Verify required directories exist
ls -la frontend/
ls -la backend/
ls -la specs/
ls -la .spec-kit/
```

**Expected**:
- `/frontend/` contains `CLAUDE.md`
- `/backend/` contains `CLAUDE.md`
- `/specs/` contains subdirectories and documentation
- `/.spec-kit/` contains `config.yaml`

### 2. Spec Organization

```bash
# Verify spec structure
ls -la specs/
ls -la specs/features/
ls -la specs/api/
ls -la specs/database/
ls -la specs/ui/
```

**Expected**:
- `specs/overview.md` exists
- `specs/architecture.md` exists
- All four subdirectories exist (features/, api/, database/, ui/)

### 3. CLAUDE.md Files

```bash
# Verify context files
cat CLAUDE.md | head -20
cat frontend/CLAUDE.md | head -20
cat backend/CLAUDE.md | head -20
```

**Expected**:
- Root CLAUDE.md references AGENTS.md
- Frontend CLAUDE.md mentions Next.js and restricts backend work
- Backend CLAUDE.md mentions FastAPI and restricts frontend work

### 4. Phase I Preservation

```bash
# Verify Phase I code unchanged
git diff HEAD~1 -- src/
```

**Expected**: No output (no changes to /src)

### 5. Spec-Kit Configuration

```bash
# Verify config exists and is valid
cat .spec-kit/config.yaml
```

**Expected**: Valid YAML with specs_directory and history_directory

## Success Criteria Checklist

| Criterion | Verification Command | Expected |
|-----------|---------------------|----------|
| SC-001: Directories exist | `ls frontend backend specs .spec-kit` | All listed |
| SC-002: CLAUDE.md files | `ls CLAUDE.md frontend/CLAUDE.md backend/CLAUDE.md` | All exist |
| SC-003: Spec subdirs | `ls specs/features specs/api specs/database specs/ui` | All exist |
| SC-004: Phase I unchanged | `git diff HEAD~1 -- src/` | No output |
| SC-005: Config valid | `cat .spec-kit/config.yaml` | Valid YAML |
| SC-006: @specs paths work | Documentation in root CLAUDE.md | Explained |

## Running Phase I App (Unchanged)

Phase I console app continues to work:

```bash
python -m src.main
```

This confirms Phase I functionality is preserved.

---

## Next Steps

After Phase 2.0 verification passes:
1. Commit all changes
2. Push to feature branch
3. Proceed to **Phase 2.1: Database Persistence Layer**
