# Python Backend Structure Troubleshooting Guide

## Common Issues and Solutions

### 1. Import Issues
**Problem**: Circular imports or import errors
**Symptoms**: "ImportError", "circular import", "cannot import name"
**Solutions**:
- Check for circular dependencies between modules
- Use late imports when possible
- Restructure modules to follow dependency direction

```python
# ❌ Wrong: Circular import
# app/models/user.py
from app.services.user_service import UserService  # Circular dependency

class User:
    def get_service(self):
        return UserService()

# app/services/user_service.py
from app.models.user import User  # Circular dependency

class UserService:
    def process_user(self, user: User):
        return user.get_service()

# ✅ Correct: Dependency direction
# app/models/user.py
class User:
    def __init__(self, email: str, full_name: str = None):
        self.email = email
        self.full_name = full_name

# app/services/user_service.py
from app.models.user import User

class UserService:
    def process_user(self, user: User):
        # Process user without creating circular dependency
        return user.email.upper()
```

### 2. Database Connection Issues
**Problem**: Database connections failing or hanging
**Symptoms**: "OperationalError", "Connection timeout", "Database is locked"
**Solutions**:
- Check database URL configuration
- Verify database server is running
- Review connection pooling settings
- Check for unclosed database sessions

### 3. FastAPI Dependency Injection Issues
**Problem**: Dependencies not injecting correctly
**Symptoms**: "Missing dependency", "No value for dependency", "Context manager issues"
**Solutions**:
- Ensure proper dependency function signatures
- Check for correct use of Depends()
- Verify dependency scopes and lifetimes

## Debugging Steps

### Step 1: Verify Project Structure
```bash
# Check if directory structure follows expected pattern
tree app/
# Should show:
# app/
# ├── __init__.py
# ├── main.py
# ├── config.py
# ├── database/
# │   ├── __init__.py
# │   └── session.py
# ├── models/
# │   ├── __init__.py
# │   └── user.py
# ├── schemas/
# │   ├── __init__.py
# │   └── user.py
# ├── api/
# │   ├── __init__.py
# │   └── v1/
# │       ├── __init__.py
# │       └── endpoints/
# │           ├── __init__.py
# │           └── users.py
```

### Step 2: Check Import Paths
```python
# Verify import paths work correctly
# test_imports.py
def test_imports():
    try:
        from app.main import app
        print("✓ Main app imports successfully")

        from app.models.user import User
        print("✓ Models import successfully")

        from app.schemas.user import UserCreate
        print("✓ Schemas import successfully")

        from app.database.session import get_db
        print("✓ Database imports successfully")

        from app.api.v1.endpoints.users import router
        print("✓ API endpoints import successfully")

        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

if __name__ == "__main__":
    test_imports()
```

### Step 3: Test Database Connection
```python
# test_database.py
from sqlalchemy import create_engine, text
from app.config import settings

def test_database_connection():
    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection successful")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()
```

## Error Messages and Solutions

### "No module named 'app'"
**Cause**: Python path not configured correctly
**Solutions**:
- Add project root to PYTHONPATH
- Install package in development mode: `pip install -e .`
- Run from project root directory

### "AttributeError: module has no attribute"
**Cause**: Missing or incorrectly exported attributes
**Solutions**:
- Check __init__.py files for proper exports
- Verify function/class names match imports
- Use `__all__` to explicitly define exports

```python
# ❌ Wrong: No explicit exports
# app/api/v1/__init__.py
from .endpoints import users

# ✅ Correct: Explicit exports
# app/api/v1/__init__.py
from .endpoints import users
from .api import api_router

__all__ = ["api_router", "users"]
```

### "RuntimeError: generator didn't yield"
**Cause**: Generator dependency not yielding properly
**Solutions**:
- Ensure dependency generator yields value
- Check try/finally blocks in context managers
- Verify FastAPI dependency function structure

```python
# ❌ Wrong: Generator not yielding
def get_db():
    db = SessionLocal()
    # Forgot to yield
    db.close()

# ✅ Correct: Generator yields value
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### "SQLAlchemy Error: object is already attached to session"
**Cause**: Database session management issues
**Solutions**:
- Don't pass database objects between requests
- Use Pydantic models for serialization
- Refresh objects when needed

### "FastAPI Validation Error"
**Cause**: Request/response model validation failure
**Solutions**:
- Check Pydantic model field types
- Verify required fields are provided
- Validate field constraints (min/max, regex, etc.)

## Development vs Production Differences

### Environment Configuration
```python
# config.py
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database settings
    database_url: str = "sqlite:///./test.db"

    # API settings
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    # Security settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

# Environment-specific settings
def get_settings():
    env = os.getenv("ENVIRONMENT", "development")

    if env == "production":
        return Settings(
            database_url=os.getenv("DATABASE_URL"),
            debug=False,
            secret_key=os.getenv("SECRET_KEY")
        )
    else:
        return Settings(debug=True)
```

### Debug Logging
```python
# utils/debug.py
import logging
import sys

def setup_debug_logging():
    """Setup debug logging for development"""
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

def enable_sqlalchemy_logging():
    """Enable SQLAlchemy query logging"""
    logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy.dialects').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy.orm').setLevel(logging.INFO)
```

## Testing Backend Structure

### Unit Tests for Structure
```python
# tests/test_structure.py
import os
import pytest
from pathlib import Path

def test_directory_structure():
    """Test that required directories exist"""
    required_dirs = [
        "app",
        "app/models",
        "app/schemas",
        "app/api",
        "app/api/v1",
        "app/api/v1/endpoints",
        "app/database",
        "app/utils",
        "tests",
        "tests/test_api",
        "tests/test_models",
        "tests/test_schemas"
    ]

    for directory in required_dirs:
        assert os.path.isdir(directory), f"Directory {directory} does not exist"

def test_required_files():
    """Test that required files exist"""
    required_files = [
        "app/main.py",
        "app/config.py",
        "app/database/session.py",
        "app/api/v1/api.py"
    ]

    for file_path in required_files:
        assert os.path.isfile(file_path), f"File {file_path} does not exist"

def test_init_files():
    """Test that __init__.py files exist"""
    init_files = [
        "app/__init__.py",
        "app/models/__init__.py",
        "app/schemas/__init__.py",
        "app/api/__init__.py",
        "app/api/v1/__init__.py",
        "app/api/v1/endpoints/__init__.py"
    ]

    for file_path in init_files:
        assert os.path.isfile(file_path), f"__init__.py file {file_path} does not exist"
```

### Integration Tests
```python
# tests/test_api/test_users.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import get_db
from app.models.user import User

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_create_user(client: TestClient):
    """Test creating a user through API"""
    user_data = {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }

    response = client.post("/api/v1/users/", json=user_data)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"

def test_get_user(client: TestClient):
    """Test retrieving a user through API"""
    # First create a user
    user_data = {
        "email": "test2@example.com",
        "password": "password123",
        "full_name": "Test User 2"
    }

    create_response = client.post("/api/v1/users/", json=user_data)
    assert create_response.status_code == 200

    created_user = create_response.json()
    user_id = created_user["id"]

    # Then retrieve the user
    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == "test2@example.com"
    assert data["id"] == user_id
```

## Performance Debugging

### Database Query Optimization
```python
# utils/query_profiler.py
import time
import functools
from sqlalchemy import event
from sqlalchemy.engine import Engine

class QueryProfiler:
    def __init__(self):
        self.queries = []
        self.start_time = None

    def start_profiling(self, engine):
        """Start query profiling"""
        self.start_time = time.time()

        @event.listens_for(engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            context._query_start_time = time.time()

        @event.listens_for(engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            total = time.time() - context._query_start_time
            self.queries.append({
                'statement': statement,
                'parameters': parameters,
                'duration': total
            })

            if total > 1.0:  # Log slow queries (> 1 second)
                print(f"SLOW QUERY ({total:.2f}s): {statement[:100]}...")

    def get_stats(self):
        """Get query performance statistics"""
        if not self.queries:
            return {}

        durations = [q['duration'] for q in self.queries]
        total_time = time.time() - self.start_time if self.start_time else 0

        return {
            'total_queries': len(self.queries),
            'total_time': total_time,
            'avg_query_time': sum(durations) / len(durations),
            'max_query_time': max(durations),
            'slow_queries': len([q for q in durations if q > 1.0])
        }
```

### API Performance Testing
```python
# utils/api_profiler.py
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

def test_api_performance(base_url: str, endpoint: str, num_requests: int = 100):
    """Test API endpoint performance under load"""
    url = f"{base_url}{endpoint}"
    results = []

    def make_request():
        start_time = time.time()
        try:
            response = requests.get(url)
            end_time = time.time()
            return {
                'status_code': response.status_code,
                'response_time': end_time - start_time,
                'success': response.status_code == 200
            }
        except Exception as e:
            end_time = time.time()
            return {
                'status_code': None,
                'response_time': end_time - start_time,
                'success': False,
                'error': str(e)
            }

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request) for _ in range(num_requests)]

        for future in as_completed(futures):
            results.append(future.result())

    # Analyze results
    successful_requests = [r for r in results if r['success']]
    failed_requests = [r for r in results if not r['success']]
    response_times = [r['response_time'] for r in successful_requests]

    if response_times:
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)

        print(f"API Performance Test Results:")
        print(f"  Total Requests: {num_requests}")
        print(f"  Successful: {len(successful_requests)}")
        print(f"  Failed: {len(failed_requests)}")
        print(f"  Average Response Time: {avg_response_time:.3f}s")
        print(f"  Max Response Time: {max_response_time:.3f}s")
        print(f"  Min Response Time: {min_response_time:.3f}s")

    return results
```

## Security Troubleshooting

### Dependency Security Checks
```bash
# Check for vulnerable dependencies
pip install safety
safety check

# Or using pip-audit
pip install pip-audit
pip-audit
```

### Code Security Issues
```python
# utils/security_scanner.py
import ast
import os
from typing import List, Dict

def find_security_issues(file_path: str) -> List[Dict]:
    """Scan Python file for security issues"""
    with open(file_path, 'r') as f:
        try:
            tree = ast.parse(f.read())
        except SyntaxError:
            return []

    issues = []

    for node in ast.walk(tree):
        # Check for eval usage
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id == 'eval':
                issues.append({
                    'type': 'INSECURE_EVAL',
                    'line': node.lineno,
                    'message': 'Use of eval() is insecure'
                })

        # Check for exec usage
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id == 'exec':
                issues.append({
                    'type': 'INSECURE_EXEC',
                    'line': node.lineno,
                    'message': 'Use of exec() is insecure'
                })

        # Check for hardcoded secrets
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if 'secret' in target.id.lower() or 'password' in target.id.lower():
                        if isinstance(node.value, ast.Constant):
                            issues.append({
                                'type': 'HARDCODED_SECRET',
                                'line': node.lineno,
                                'message': f'Hardcoded secret in variable {target.id}'
                            })

    return issues

def scan_project_security(project_path: str):
    """Scan entire project for security issues"""
    security_issues = []

    for root, dirs, files in os.walk(project_path):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                issues = find_security_issues(file_path)

                for issue in issues:
                    issue['file'] = file_path
                    security_issues.append(issue)

    return security_issues
```

## Common Misconfigurations

### Incorrect Database URL
❌ Bad:
```python
# ❌ Wrong: Hardcoded database URL
DATABASE_URL = "postgresql://user:password@localhost/mydb"
```

✅ Good:
```python
# ✅ Correct: Environment-based configuration
from app.config import settings
DATABASE_URL = settings.database_url
```

### Missing Dependency Injection
❌ Bad:
```python
# ❌ Wrong: Direct instantiation in endpoint
from app.database.session import SessionLocal

@router.post("/users/")
def create_user(user: UserCreate):
    db = SessionLocal()  # Direct instantiation - bad practice
    # ... operations
    db.close()  # May not execute if exception occurs
```

✅ Good:
```python
# ✅ Correct: Dependency injection
from fastapi import Depends
from app.database.session import get_db
from sqlmodel import Session

@router.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # db session is properly managed by FastAPI dependency system
    # ... operations
    # Session is automatically closed after request
```

### Improper Error Handling
❌ Bad:
```python
# ❌ Wrong: Generic error handling
@router.get("/users/{user_id}")
def get_user(user_id: int):
    try:
        user = get_user_from_db(user_id)
        return user
    except Exception:
        return {"error": "Something went wrong"}  # Too generic
```

✅ Good:
```python
# ✅ Correct: Specific error handling
from fastapi import HTTPException, status

@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_from_db(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user
```

## Monitoring and Observability

### Health Check Implementation
```python
# app/api/health.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.database.session import get_db
from app.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "checks": {
            "database": False,
            "api": True,
            "config": True
        }
    }

    # Test database connection
    try:
        db = next(get_db())
        result = db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = True
        db.close()
    except Exception as e:
        health_status["checks"]["database"] = False
        health_status["database_error"] = str(e)

    # Overall status
    if not all(health_status["checks"].values()):
        health_status["status"] = "unhealthy"

    return health_status
```

### Logging Configuration
```python
# app/logging_config.py
import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging():
    """Setup structured logging for the application"""
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Create JSON formatter
    json_formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(json_formatter)

    # Add handler to root logger
    root_logger.addHandler(console_handler)

    # Set specific log levels for libraries
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.INFO)

# Call setup in main app
setup_logging()
```

## Recovery Procedures

### Database Connection Recovery
```python
# utils/db_recovery.py
import time
from sqlalchemy import create_engine
from sqlalchemy.exc import DisconnectionError, OperationalError
from app.config import settings

def create_engine_with_recovery():
    """Create database engine with automatic recovery"""
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,   # Recycle connections every hour
        pool_size=10,
        max_overflow=20,
        echo=False
    )

    # Add event listeners for disconnection recovery
    @event.listens_for(engine, "handle_error")
    def handle_db_error(context):
        if isinstance(context.original_exception, (DisconnectionError, OperationalError)):
            print(f"Database disconnection detected: {context.original_exception}")
            # The pool will automatically handle reconnection

    return engine
```

### Application Recovery
```python
# utils/app_recovery.py
import signal
import sys
import atexit
from app.database.session import engine

def graceful_shutdown():
    """Handle graceful application shutdown"""
    print("Shutting down gracefully...")

    # Close database connections
    try:
        engine.dispose()
        print("Database connections closed")
    except Exception as e:
        print(f"Error closing database connections: {e}")

    print("Application shutdown complete")

# Register cleanup function
atexit.register(graceful_shutdown)

def signal_handler(sig, frame):
    """Handle termination signals"""
    print(f'Received signal {sig}, shutting down...')
    graceful_shutdown()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
```

These troubleshooting patterns will help diagnose and resolve common Python backend structure issues effectively.