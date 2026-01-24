# Neon PostgreSQL Integration Security Best Practices

## Connection Security

### SSL/TLS Configuration
```python
# ✅ Recommended: SSL mode configuration for Neon
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"

# ❌ Never: Disable SSL in production
BAD_DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=disable"
```

### SSL Mode Selection
```python
# Recommended SSL modes for different environments
SSL_MODES = {
    'development': 'require',      # Require SSL but don't verify certificate
    'staging': 'require',          # Require SSL but don't verify certificate
    'production': 'verify-full'    # Require SSL with full certificate verification
}

def get_ssl_mode(environment):
    return SSL_MODES.get(environment, 'require')
```

## Credential Management

### Environment Variable Security
```python
# ✅ Secure: Load credentials from environment variables
import os
from urllib.parse import urlparse

def get_secure_database_url():
    """
    Construct database URL from environment variables securely
    """
    db_user = os.getenv('NEON_DB_USER')
    db_pass = os.getenv('NEON_DB_PASS')
    db_host = os.getenv('NEON_DB_HOST')
    db_name = os.getenv('NEON_DB_NAME')

    if not all([db_user, db_pass, db_host, db_name]):
        raise ValueError("Missing required database environment variables")

    # URL encode credentials to handle special characters
    from urllib.parse import quote_plus
    encoded_pass = quote_plus(db_pass)

    return f"postgresql://{db_user}:{encoded_pass}@{db_host}/{db_name}?sslmode=require"
```

### Credential Validation
```python
# ✅ Secure: Validate credentials before use
def validate_database_credentials():
    """
    Validate that database credentials are properly configured
    """
    required_creds = [
        'NEON_DB_USER',
        'NEON_DB_PASS',
        'NEON_DB_HOST',
        'NEON_DB_NAME'
    ]

    missing = []
    for cred in required_creds:
        if not os.getenv(cred):
            missing.append(cred)

    if missing:
        raise ValueError(f"Missing required database credentials: {', '.join(missing)}")

    # Validate password complexity
    password = os.getenv('NEON_DB_PASS')
    if len(password) < 16:
        raise ValueError("Database password should be at least 16 characters")

    # Check for common weak patterns
    if password.lower() in ['password', 'admin', '12345678']:
        raise ValueError("Database password is too weak")
```

## Connection Security

### Secure Connection Configuration
```python
# ✅ Secure: Proper connection configuration
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

def create_secure_neon_engine():
    """
    Create SQLAlchemy engine with secure configuration for Neon
    """
    database_url = os.getenv("DATABASE_URL")

    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,            # Verify connections before use
        pool_recycle=300,              # Recycle connections to prevent staleness
        pool_timeout=30,               # Timeout for getting connection from pool
        echo=False,                    # Never enable echo in production
        connect_args={
            "connect_timeout": 10,      # Connection timeout
            "sslmode": "require",       # Require SSL
            "application_name": "myapp" # Identify application to database
        }
    )

    return engine
```

### Connection Timeout Configuration
```python
# ✅ Secure: Proper timeout configuration
CONNECTION_TIMEOUTS = {
    'connect_timeout': 10,      # Time to establish connection
    'command_timeout': 30,      # Time to execute command
    'idle_in_transaction_timeout': 300  # Time idle in transaction
}

def get_secure_connect_args():
    return {
        "connect_timeout": CONNECTION_TIMEOUTS['connect_timeout'],
        "command_timeout": CONNECTION_TIMEOUTS['command_timeout'],
        "options": f"-c idle_in_transaction_session_timeout={CONNECTION_TIMEOUTS['idle_in_transaction_timeout']}"
    }
```

## Input Validation and Sanitization

### Parameterized Queries
```python
# ✅ Secure: Use parameterized queries to prevent SQL injection
from sqlalchemy import text

def get_user_secure(user_id, db):
    """
    Secure way to query user by ID using parameterized query
    """
    stmt = text("SELECT * FROM users WHERE id = :user_id")
    result = db.execute(stmt, {"user_id": user_id})
    return result.fetchone()

# ❌ Never: String concatenation in queries
def get_user_insecure(user_id, db):
    """
    Insecure way - vulnerable to SQL injection
    """
    stmt = f"SELECT * FROM users WHERE id = {user_id}"  # DANGEROUS!
    result = db.execute(stmt)
    return result.fetchone()
```

### Input Validation
```python
# ✅ Secure: Validate inputs before database operations
def validate_user_input(user_data):
    """
    Validate user input before database operations
    """
    import re

    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if 'email' in user_data and not re.match(email_pattern, user_data['email']):
        raise ValueError("Invalid email format")

    # Validate required fields
    required_fields = ['email', 'name']
    for field in required_fields:
        if field not in user_data or not user_data[field]:
            raise ValueError(f"Required field '{field}' is missing or empty")

    # Validate string lengths
    if 'name' in user_data and len(user_data['name']) > 100:
        raise ValueError("Name exceeds maximum length of 100 characters")

    return True
```

## Session and Transaction Security

### Secure Session Management
```python
# ✅ Secure: Proper session management
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

@contextmanager
def get_secure_db_session():
    """
    Context manager for secure database sessions
    """
    Session = sessionmaker()
    session = Session()

    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage
def create_user_secure(user_data):
    with get_secure_db_session() as session:
        validate_user_input(user_data)
        user = User(**user_data)
        session.add(user)
        # Commit happens automatically if no exception
        return user
```

### Transaction Security
```python
# ✅ Secure: Secure transaction handling
from sqlalchemy.exc import IntegrityError

def transfer_funds_secure(from_account, to_account, amount, db):
    """
    Secure transaction with proper error handling
    """
    try:
        # Validate inputs
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Check balances and perform transfer in single transaction
        from_acc = db.query(Account).filter(Account.id == from_account).first()
        if from_acc.balance < amount:
            raise ValueError("Insufficient funds")

        # Perform transfer
        from_acc.balance -= amount
        to_acc = db.query(Account).filter(Account.id == to_account).first()
        to_acc.balance += amount

        db.commit()
        return {"status": "success", "amount": amount}

    except IntegrityError:
        db.rollback()
        raise ValueError("Transfer failed due to constraint violation")
    except Exception:
        db.rollback()
        raise
```

## Logging and Monitoring Security

### Secure Logging
```python
# ✅ Secure: Log database activities without exposing sensitive data
import logging

logger = logging.getLogger(__name__)

def log_database_operation(operation, table, user_id, success=True):
    """
    Log database operations without exposing sensitive data
    """
    log_data = {
        'operation': operation,
        'table': table,
        'user_id': user_id,
        'success': success,
        'timestamp': datetime.utcnow().isoformat()
    }

    # Never log sensitive data like passwords, tokens, or full queries
    if success:
        logger.info(f"DB Operation: {log_data}")
    else:
        logger.warning(f"DB Operation Failed: {log_data}")

def sanitize_query_log(query, params):
    """
    Sanitize query logs to remove sensitive data
    """
    # Replace sensitive parameter values with placeholders
    sanitized_params = {}
    for key, value in params.items():
        if 'password' in key.lower() or 'token' in key.lower() or 'secret' in key.lower():
            sanitized_params[key] = '[REDACTED]'
        else:
            sanitized_params[key] = value

    return {
        'query': query,
        'params': sanitized_params
    }
```

## Connection Pool Security

### Secure Pool Configuration
```python
# ✅ Secure: Secure connection pool configuration
def create_secure_pool_config():
    """
    Create secure connection pool configuration
    """
    return {
        'pool_size': 5,                    # Conservative for serverless
        'max_overflow': 10,               # Limited overflow
        'pool_pre_ping': True,            # Verify connections before use
        'pool_recycle': 300,              # Recycle connections every 5 minutes
        'pool_timeout': 30,               # Timeout waiting for connection
        'echo': False,                    # Never enable echo in production
        'pool_reset_on_return': 'commit'  # Reset connections when returned
    }

def create_secure_engine_with_pool():
    """
    Create engine with secure pool configuration
    """
    database_url = os.getenv("DATABASE_URL")
    pool_config = create_secure_pool_config()

    engine = create_engine(
        database_url,
        **pool_config,
        connect_args=get_secure_connect_args()
    )

    return engine
```

## Environment Security

### Secure Environment Loading
```python
# ✅ Secure: Load environment variables securely
from dotenv import load_dotenv
import os

def load_secure_environment():
    """
    Load environment variables with security validation
    """
    # Only load .env in development
    if os.getenv('ENVIRONMENT') == 'development':
        load_dotenv()

    # Validate that sensitive variables are not in version control
    validate_env_vars()

def validate_env_vars():
    """
    Validate environment variables are properly set
    """
    sensitive_vars = [
        'NEON_DB_USER',
        'NEON_DB_PASS',
        'NEON_DB_HOST',
        'NEON_DB_NAME'
    ]

    for var in sensitive_vars:
        value = os.getenv(var)
        if not value:
            raise ValueError(f"Environment variable {var} is not set")

        # Check for placeholder values
        if value in ['your-password', 'your-host', 'your-database']:
            raise ValueError(f"Environment variable {var} contains placeholder value")
```

## Migration Security

### Secure Migration Practices
```python
# ✅ Secure: Secure migration configuration
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.environment import EnvironmentContext

def run_secure_migrations():
    """
    Run migrations with security considerations
    """
    alembic_cfg = Config("alembic.ini")

    # Use environment-specific database URL
    alembic_cfg.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

    script = ScriptDirectory.from_config(alembic_cfg)

    def run_migrations_online():
        connectable = create_secure_engine_with_pool()

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=get_target_metadata(),
                compare_type=True,  # Include type changes in autogen
                compare_server_default=True,  # Include server defaults in autogen
                render_as_batch=True  # Use batch operations for SQLite compatibility
            )

            with context.begin_transaction():
                context.run_migrations()

    run_migrations_online()
```

## Monitoring and Auditing

### Security Monitoring
```python
# ✅ Secure: Monitor for security events
class SecurityMonitor:
    def __init__(self):
        self.logger = logging.getLogger('security')
        self.alert_thresholds = {
            'failed_logins': 5,
            'connection_errors': 10
        }

    def log_security_event(self, event_type, details, severity='medium'):
        """
        Log security-related events
        """
        security_log = {
            'event_type': event_type,
            'severity': severity,
            'details': self.sanitize_security_details(details),
            'timestamp': datetime.utcnow().isoformat(),
            'source_ip': details.get('source_ip', 'unknown')
        }

        if severity == 'high':
            self.logger.critical(f"SECURITY ALERT: {security_log}")
        elif severity == 'medium':
            self.logger.warning(f"Security Event: {security_log}")
        else:
            self.logger.info(f"Security Info: {security_log}")

    def sanitize_security_details(self, details):
        """
        Sanitize security details to remove sensitive information
        """
        sanitized = {}
        for key, value in details.items():
            if 'password' in key.lower() or 'token' in key.lower():
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        return sanitized
```

## Backup and Recovery Security

### Secure Backup Practices
```python
# ✅ Secure: Secure backup configuration
import subprocess
import os
from datetime import datetime

def create_secure_backup():
    """
    Create secure database backup
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"backup_{timestamp}.sql"

    # Use environment variables for connection details
    db_url = os.getenv("DATABASE_URL")

    # Use pg_dump with secure connection
    cmd = [
        "pg_dump",
        "--dbname", db_url,
        "--file", backup_file,
        "--no-password",  # Don't prompt for password
        "--verbose"
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"Backup created successfully: {backup_file}")

        # Set secure file permissions
        os.chmod(backup_file, 0o600)  # Read/write for owner only

        return backup_file
    except subprocess.CalledProcessError as e:
        print(f"Backup failed: {e.stderr}")
        raise
```

## Compliance Considerations

### GDPR Compliance
```python
# ✅ Secure: GDPR-compliant data handling
def handle_user_data_deletion(user_id):
    """
    Handle user data deletion in compliance with GDPR
    """
    # Log the deletion request
    log_data_deletion_request(user_id)

    # Delete user data in a secure transaction
    with get_secure_db_session() as session:
        # Soft delete or hard delete based on policy
        user = session.query(User).filter(User.id == user_id).first()
        if user:
            # Update with NULL sensitive fields
            user.email = None
            user.name = "DELETED_USER"
            user.deleted_at = datetime.utcnow()

            # Commit the changes
            session.commit()

def log_data_deletion_request(user_id):
    """
    Log data deletion request without exposing user data
    """
    logger.info(f"GDPR data deletion requested for user_id: {user_id}")
```

## Security Testing

### Automated Security Tests
```python
# tests/test_security.py
import pytest
from unittest.mock import patch
import os

def test_secure_connection_string():
    """
    Test that connection string contains required security parameters
    """
    database_url = os.getenv("DATABASE_URL")

    assert database_url is not None
    assert "sslmode=require" in database_url.lower()

def test_no_credentials_in_logs(caplog):
    """
    Test that credentials are not logged
    """
    # Attempt to trigger a log that might contain credentials
    with caplog.at_level(logging.WARNING):
        # Some operation that might log sensitive info
        pass

    # Verify no credentials appear in logs
    for record in caplog.records:
        assert "password" not in record.getMessage().lower()
        assert os.getenv("NEON_DB_PASS") not in record.getMessage()

@patch('os.getenv')
def test_missing_credentials_validation(mock_getenv):
    """
    Test validation of missing credentials
    """
    mock_getenv.side_effect = lambda x: None if x in ['NEON_DB_USER', 'NEON_DB_PASS'] else 'dummy_value'

    with pytest.raises(ValueError, match="Missing required database credentials"):
        validate_database_credentials()
```

## Security Policies

### Connection Security Checklist
```markdown
# Database Connection Security Checklist

## Before deploying to production:

### Credentials
- [ ] Database credentials stored in environment variables only
- [ ] No hardcoded credentials in source code
- [ ] Credentials properly validated before use
- [ ] Passwords meet complexity requirements

### SSL/TLS
- [ ] SSL mode set to 'require' or higher in production
- [ ] Certificate verification enabled
- [ ] Connection string includes proper SSL parameters

### Input Validation
- [ ] All user inputs validated before database queries
- [ ] Parameterized queries used everywhere
- [ ] SQL injection prevention implemented

### Logging
- [ ] No sensitive data logged
- [ ] Query parameters sanitized in logs
- [ ] Security events monitored

### Connection Management
- [ ] Connection pooling configured securely
- [ ] Proper timeouts set
- [ ] Sessions closed properly
- [ ] Transaction handling secure
```

These security practices ensure that your Neon PostgreSQL integration remains secure throughout its lifecycle while maintaining the benefits of serverless PostgreSQL.