# Neon PostgreSQL Integration Troubleshooting Guide

## Common Issues and Solutions

### 1. Connection Issues
**Problem**: Cannot connect to Neon PostgreSQL database
**Symptoms**: "Connection refused", "Authentication failed", "SSL error"
**Solutions**:
- Verify the connection string format
- Check SSL mode configuration
- Validate credentials
- Ensure firewall rules allow connections

```python
# ❌ Wrong: Incorrect SSL mode
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname"  # Missing sslmode

# ✅ Correct: Proper SSL configuration
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

### 2. Serverless Cold Start Issues
**Problem**: First connection after inactivity takes too long
**Symptoms**: Slow initial responses, timeout errors
**Solutions**:
- Implement connection warming strategies
- Use connection pooling effectively
- Adjust timeout settings appropriately
- Consider Neon's serverless nature in design

### 3. Connection Pool Exhaustion
**Problem**: Application runs out of database connections
**Symptoms**: "Too many connections", "Pool timeout"
**Solutions**:
- Review pool size configuration
- Ensure connections are properly closed
- Implement connection reuse patterns
- Monitor connection usage

### 4. SSL/TLS Configuration Issues
**Problem**: SSL connection failures
**Symptoms**: "SSL error", "Certificate verification failed"
**Solutions**:
- Ensure SSL mode is set to 'require' for Neon
- Verify certificate authorities
- Check client library compatibility

## Debugging Steps

### Step 1: Verify Connection String
```python
# Check if connection string is properly formatted
import os
from urllib.parse import urlparse

def validate_connection_string():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("DATABASE_URL environment variable not set")
        return False

    try:
        parsed = urlparse(database_url)
        print(f"Host: {parsed.hostname}")
        print(f"Port: {parsed.port}")
        print(f"Database: {parsed.path}")
        print(f"Username: {parsed.username}")

        # Check for SSL parameter
        if 'sslmode=require' not in database_url:
            print("⚠️  Warning: sslmode=require not found in connection string")

        return True
    except Exception as e:
        print(f"Error parsing connection string: {e}")
        return False

validate_connection_string()
```

### Step 2: Test Basic Connectivity
```python
# Simple connection test
import psycopg2
from urllib.parse import urlparse

def test_basic_connectivity():
    database_url = os.getenv("DATABASE_URL")

    try:
        # Test with psycopg2 directly
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        result = cur.fetchone()

        print(f"Basic connection test: {'PASS' if result[0] == 1 else 'FAIL'}")

        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Basic connection test failed: {e}")
        return False

test_basic_connectivity()
```

### Step 3: Test SQLAlchemy Connection
```python
# Test SQLAlchemy connection
from sqlalchemy import create_engine, text

def test_sqlalchemy_connection():
    database_url = os.getenv("DATABASE_URL")

    try:
        engine = create_engine(database_url, echo=True)

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).fetchone()

        print(f"SQLAlchemy connection test: {'PASS' if result[0] == 1 else 'FAIL'}")
        return True
    except Exception as e:
        print(f"SQLAlchemy connection test failed: {e}")
        return False

test_sqlalchemy_connection()
```

### Step 4: Check Pool Statistics
```python
# Check connection pool status
def check_pool_status(engine):
    pool = engine.pool
    print(f"Pool status:")
    print(f"  Size: {pool.size()}")
    print(f"  Checked out: {pool.checkedout()}")
    print(f"  Overflow: {pool.overflow()}")
    print(f"  Timeout: {pool.timeout}")
```

## Error Messages and Solutions

### "FATAL: database does not exist"
**Cause**: Database name in connection string is incorrect
**Solutions**:
- Verify database name in Neon dashboard
- Check for typos in connection string
- Ensure database is created in Neon project

### "FATAL: password authentication failed"
**Cause**: Incorrect password or username
**Solutions**:
- Verify credentials in Neon dashboard
- Check for URL encoding issues in password
- Ensure password is properly URL-encoded if it contains special characters

### "SSL SYSCALL error: EOF detected"
**Cause**: Connection was terminated by server
**Solutions**:
- This is often normal for Neon's serverless behavior
- Implement retry logic
- Use connection pooling with proper settings
- Check for connection timeout settings

### "remaining connection slots are reserved for non-replication superuser connections"
**Cause**: Connection limit reached
**Solutions**:
- Reduce pool size settings
- Close connections properly
- Monitor active connections in Neon dashboard
- Upgrade Neon plan if needed

### "could not translate host to address"
**Cause**: Hostname is incorrect or DNS resolution failed
**Solutions**:
- Verify hostname in connection string
- Check for typos in endpoint
- Ensure using correct region for Neon project

### "connection timeout expired"
**Cause**: Connection took too long to establish
**Solutions**:
- Increase connection timeout
- Check network connectivity
- Consider Neon's cold start behavior
- Optimize connection settings

## Development vs Production Differences

### Environment Configuration
```python
# config/database.py
import os

class DatabaseConfig:
    def get_config(self):
        env = os.getenv("ENVIRONMENT", "development")

        base_config = {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "echo": False
        }

        if env == "development":
            # More permissive settings for development
            dev_config = {
                "pool_size": 3,
                "max_overflow": 5,
                "pool_recycle": 180,  # Shorter recycle time for dev
                "echo": os.getenv("DEBUG_DB", "false").lower() == "true"
            }
            base_config.update(dev_config)

        elif env == "production":
            # Conservative settings for production
            prod_config = {
                "pool_size": 10,
                "max_overflow": 20,
                "pool_recycle": 300,
                "pool_timeout": 30
            }
            base_config.update(prod_config)

        return base_config
```

### Debug Logging
```python
# Enable detailed logging for debugging
import logging

def enable_debug_logging():
    logging.basicConfig()
    logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.DEBUG)
    logging.getLogger('sqlalchemy.dialects').setLevel(logging.INFO)
```

## Testing Database Integration

### Unit Tests for Connection
```python
# tests/test_database_connection.py
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

def test_database_connection_string_format():
    """Test that database URL has correct format"""
    database_url = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"

    assert database_url.startswith("postgresql://")
    assert "sslmode=require" in database_url
    assert "@" in database_url
    assert "?" in database_url

def test_ssl_configuration():
    """Test SSL configuration in connection string"""
    database_url = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"

    assert "sslmode=require" in database_url

@patch('sqlalchemy.create_engine')
def test_engine_creation_with_ssl(mock_create_engine):
    """Test engine creation with SSL configuration"""
    mock_engine = MagicMock()
    mock_create_engine.return_value = mock_engine

    database_url = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"
    engine = create_engine(database_url)

    # Verify engine was created with correct parameters
    mock_create_engine.assert_called_once()
```

### Integration Tests
```python
# tests/test_neon_integration.py
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

@pytest.mark.integration
def test_neon_connection():
    """Test actual connection to Neon database"""
    database_url = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"

    try:
        engine = create_engine(database_url, connect_args={"connect_timeout": 10})

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).fetchone()
            assert result[0] == 1

    except OperationalError as e:
        pytest.skip(f"Cannot connect to Neon database: {e}")
    except Exception as e:
        pytest.fail(f"Unexpected error during connection test: {e}")

@pytest.mark.integration
def test_neon_pool_behavior():
    """Test connection pool behavior with Neon"""
    database_url = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"

    engine = create_engine(
        database_url,
        pool_size=2,
        max_overflow=2,
        pool_pre_ping=True,
        pool_recycle=300
    )

    # Test multiple connections
    connections = []
    for i in range(4):
        conn = engine.connect()
        connections.append(conn)

        # Execute a simple query
        result = conn.execute(text("SELECT 1")).fetchone()
        assert result[0] == 1

    # Close all connections
    for conn in connections:
        conn.close()
```

## Performance Debugging

### Connection Performance Analysis
```python
# tools/connection_analyzer.py
import time
from sqlalchemy import create_engine, text

def analyze_connection_performance():
    """Analyze connection establishment performance"""
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url)

    # Test multiple connection establishments
    connection_times = []

    for i in range(10):
        start_time = time.time()
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            end_time = time.time()
            connection_times.append(end_time - start_time)
        except Exception as e:
            print(f"Connection {i+1} failed: {e}")

    avg_time = sum(connection_times) / len(connection_times)
    print(f"Average connection time: {avg_time:.3f}s")
    print(f"Min time: {min(connection_times):.3f}s")
    print(f"Max time: {max(connection_times):.3f}s")

    return {
        "average": avg_time,
        "min": min(connection_times),
        "max": max(connection_times),
        "samples": len(connection_times)
    }
```

### Pool Performance Monitoring
```python
# tools/pool_monitor.py
import threading
import time
from sqlalchemy import create_engine, text

def monitor_pool_performance():
    """Monitor pool performance under load"""
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(
        database_url,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30
    )

    results = []

    def worker(worker_id):
        start_time = time.time()
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT pg_sleep(0.1)"))  # Simulate work
            end_time = time.time()
            results.append({
                "worker_id": worker_id,
                "duration": end_time - start_time,
                "success": True
            })
        except Exception as e:
            results.append({
                "worker_id": worker_id,
                "error": str(e),
                "success": False
            })

    # Create multiple threads to simulate load
    threads = []
    for i in range(20):
        thread = threading.Thread(target=worker, args=(i,))
        threads.append(thread)
        thread.start()

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    # Analyze results
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]

    print(f"Successful connections: {len(successful)}")
    print(f"Failed connections: {len(failed)}")

    if successful:
        avg_duration = sum(r["duration"] for r in successful) / len(successful)
        print(f"Average successful connection duration: {avg_duration:.3f}s")

    return results
```

## Security Troubleshooting

### SSL Certificate Issues
```python
# troubleshoot ssl certificate issues
import ssl
import socket

def check_ssl_certificate(hostname, port=5432):
    """Check SSL certificate validity"""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port)) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

                print(f"Certificate info for {hostname}:")
                print(f"  Subject: {cert['subject']}")
                print(f"  Issuer: {cert['issuer']}")
                print(f"  Version: {cert['version']}")

                return True
    except Exception as e:
        print(f"SSL certificate check failed: {e}")
        return False
```

### Credential Validation
```python
# validate credentials without connecting
import re

def validate_credentials_format(password):
    """Validate that password doesn't contain characters that need encoding"""
    # Check for special characters that might need URL encoding
    problematic_chars = ['@', '#', '?', '&', '=', '%']

    issues = []
    for char in problematic_chars:
        if char in password:
            issues.append(f"Contains '{char}' which may need URL encoding")

    if issues:
        print("⚠️  Potential credential issues:")
        for issue in issues:
            print(f"  - {issue}")
        return False

    return True
```

## Common Misconfigurations

### Incorrect Pool Settings
❌ Bad:
```python
# ❌ Wrong: Too aggressive pool settings for serverless
engine = create_engine(
    database_url,
    pool_size=50,        # Too large for serverless
    max_overflow=100,    # Too large for serverless
    pool_timeout=5       # Too short
)
```

✅ Good:
```python
# ✅ Correct: Conservative settings for Neon serverless
engine = create_engine(
    database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=30
)
```

### Missing SSL Configuration
❌ Bad:
```python
# ❌ Wrong: No SSL configuration
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname"
```

✅ Good:
```python
# ✅ Correct: Proper SSL configuration
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

### Not Closing Sessions Properly
❌ Bad:
```python
# ❌ Wrong: Not closing sessions properly
def get_user_bad(user_id):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    return user  # Session never closed!
```

✅ Good:
```python
# ✅ Correct: Proper session management
def get_user_good(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        return user
    finally:
        db.close()

# Or using context manager
def get_user_best(user_id):
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        return user
```

## Monitoring and Observability

### Connection Tracking
```python
# database/connection_tracker.py
import time
from threading import Lock

class ConnectionTracker:
    def __init__(self):
        self.active_connections = 0
        self.total_connections = 0
        self.lock = Lock()
        self.connection_history = []

    def track_connection_start(self):
        with self.lock:
            self.active_connections += 1
            self.total_connections += 1
            self.connection_history.append({
                'timestamp': time.time(),
                'type': 'start',
                'active_count': self.active_connections
            })

    def track_connection_end(self):
        with self.lock:
            self.active_connections -= 1
            self.connection_history.append({
                'timestamp': time.time(),
                'type': 'end',
                'active_count': self.active_connections
            })

    def get_stats(self):
        with self.lock:
            return {
                'active_connections': self.active_connections,
                'total_connections': self.total_connections,
                'peak_connections': max([h['active_count'] for h in self.connection_history], default=0)
            }

# Global tracker instance
connection_tracker = ConnectionTracker()
```

### Health Monitoring
```python
# tools/health_monitor.py
import time
import threading
from sqlalchemy import text

class DatabaseHealthMonitor:
    def __init__(self, engine, interval=30):
        self.engine = engine
        self.interval = interval
        self.last_check = None
        self.is_healthy = True
        self.running = False

    def start_monitoring(self):
        self.running = True
        monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        monitor_thread.start()

    def stop_monitoring(self):
        self.running = False

    def _monitor_loop(self):
        while self.running:
            try:
                with self.engine.connect() as conn:
                    result = conn.execute(text("SELECT 1")).fetchone()
                    self.is_healthy = result is not None

                self.last_check = time.time()
                print(f"Health check: {'HEALTHY' if self.is_healthy else 'UNHEALTHY'}")

            except Exception as e:
                self.is_healthy = False
                print(f"Health check failed: {e}")

            time.sleep(self.interval)

    def get_health_status(self):
        return {
            'healthy': self.is_healthy,
            'last_check': self.last_check,
            'interval': self.interval
        }
```

## Recovery Procedures

### Connection Recovery
```python
# tools/connection_recovery.py
import time
from sqlalchemy.exc import DisconnectionError

def recover_from_connection_failure(func, max_retries=3, backoff_factor=1):
    """
    Recover from connection failures with exponential backoff
    """
    def wrapper(*args, **kwargs):
        last_exception = None

        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except DisconnectionError as e:
                last_exception = e

                if attempt < max_retries - 1:
                    sleep_time = backoff_factor * (2 ** attempt)
                    print(f"Connection failed, retrying in {sleep_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                else:
                    print(f"All retry attempts failed after {max_retries} attempts")

        raise last_exception

    return wrapper

# Usage
@recover_from_connection_failure(max_retries=3)
def get_user_with_recovery(user_id, db):
    return db.query(User).filter(User.id == user_id).first()
```

### Pool Reset
```python
# tools/pool_reset.py
def reset_connection_pool(engine):
    """
    Reset the connection pool by disposing of all connections
    """
    print("Resetting connection pool...")
    engine.dispose()
    print("Connection pool reset complete")

    # Optionally recreate engine
    # return create_neon_engine()
```

These troubleshooting patterns will help diagnose and resolve common Neon PostgreSQL integration issues effectively.