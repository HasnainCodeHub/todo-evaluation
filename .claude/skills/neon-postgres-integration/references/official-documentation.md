# Neon PostgreSQL Integration Official Documentation and Standards

## Neon PostgreSQL Overview

### What is Neon?
Neon is a serverless PostgreSQL platform that provides instant branching, autoscaling, and pay-per-use pricing. It's designed to be compatible with PostgreSQL while offering serverless capabilities.

### Key Features
- **Instant Branching**: Create lightweight branches of your database
- **Autoscaling**: Automatically scales compute resources
- **Pay-per-use**: Only pay for active compute time
- **PostgreSQL Compatible**: Full PostgreSQL compatibility
- **Connection pooling**: Built-in connection pooling
- **Branching**: Development, staging, and production environments

## Connection String Format

### Standard PostgreSQL Connection String
```
postgresql://[user[:password]@][host][:port][/database][?parameters]
```

### Neon Connection String Format
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

### Example Connection Strings
```python
# Development environment
DEV_DATABASE_URL = "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"

# Production environment
PROD_DATABASE_URL = "postgresql://username:password@ep-yyy.eu-west-1.aws.neon.tech/dbname?sslmode=require"
```

## Serverless-Specific Considerations

### Connection Lifecycle
Neon's serverless architecture has specific behaviors:
- Compute is paused after periods of inactivity
- First connection after pause may take longer (cold start)
- Connection pools should handle connection resets gracefully
- Use connection pooling libraries to manage connections efficiently

### Connection Pooling
Neon recommends using connection pooling for optimal performance:
- **PgBouncer**: External connection pooler
- **Built-in pooling**: Neon's own connection pooling
- **Application-level pooling**: SQLAlchemy's built-in pooling

## Python Integration Patterns

### SQLAlchemy with Neon
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os

# Configure engine for Neon
def create_neon_engine():
    database_url = os.getenv("DATABASE_URL")

    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # Validates connections before use
        pool_recycle=300,    # Recycle connections every 5 minutes
        echo=False           # Set to True for debugging
    )

    return engine

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=create_neon_engine())
```

### SQLModel with Neon
```python
from sqlmodel import SQLModel, create_engine
from sqlalchemy.pool import QueuePool
import os

def create_neon_sqlmodel_engine():
    database_url = os.getenv("DATABASE_URL")

    engine = create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )

    return engine

# Create tables
def initialize_database():
    engine = create_neon_sqlmodel_engine()
    SQLModel.metadata.create_all(engine)
    return engine
```

### Async Support with Databases
```python
import databases
import sqlalchemy
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Async engine for Neon
async def create_neon_async_engine():
    database_url = os.getenv("DATABASE_URL")

    engine = create_async_engine(
        database_url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )

    return engine

# Async session factory
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=create_async_engine(),
    class_=AsyncSession
)
```

## Environment Configuration

### Environment Variables
```bash
# .env.example
DATABASE_URL=postgresql://username:password@ep-xxx.region.neon.tech/dbname?sslmode=require
NEON_PROJECT_ID=your-project-id
NEON_API_KEY=your-api-key
```

### Python Environment Loading
```python
import os
from dotenv import load_dotenv

load_dotenv()

# Validate required environment variables
required_vars = [
    'DATABASE_URL',
]

for var in required_vars:
    if not os.getenv(var):
        raise ValueError(f"Required environment variable {var} is not set")
```

## SSL/TLS Configuration

### SSL Modes
- **disable**: No SSL
- **allow**: Try without SSL first, then SSL
- **prefer**: Try SSL first, then without SSL
- **require**: SSL required (recommended for Neon)
- **verify-ca**: Require SSL with CA verification
- **verify-full**: Require SSL with full hostname verification

### Recommended SSL Configuration for Neon
```python
# Connection string with SSL requirements
DATABASE_URL = "postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

## Connection Pooling Best Practices

### Pool Size Recommendations
```python
# For Neon serverless, conservative pool sizing is recommended
POOL_SETTINGS = {
    'pool_size': 5,        # Number of connections to maintain
    'max_overflow': 10,    # Additional connections beyond pool_size
    'pool_pre_ping': True, # Verify connections before use
    'pool_recycle': 300,   # Recycle connections every 5 minutes
    'pool_timeout': 30,    # Seconds to wait before giving up on getting a connection
}
```

### Handling Connection Resets
```python
from sqlalchemy.exc import DisconnectionError
from sqlalchemy import event

def handle_disconnections(dbapi_connection, connection_record):
    """
    Handle disconnections from Neon's serverless scaling
    """
    # This will be called when SQLAlchemy detects a disconnect
    pass

# Attach the event listener
@event.listens_for(create_neon_engine(), 'handle_error')
def handle_db_error(context):
    if context.connection_invalidated:
        # Handle invalidated connection
        pass
```

## Health Check Patterns

### Database Connectivity Check
```python
from sqlalchemy import text

def check_database_health(engine):
    """
    Check database connectivity
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return result.fetchone() is not None
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False

# Async version
async def check_database_health_async(engine):
    """
    Async database connectivity check
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            return result.fetchone() is not None
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False
```

## Migration Configuration

### Alembic for Neon
```python
# alembic.ini
[alembic]
# path to migration scripts
script_location = alembic

# template used to generate migration files
# file_template = %%(rev)s_%%(slug)s

# sys.path path, will be prepended to sys.path if present.
# defaults to the current working directory.
prepend_sys_path = .

# timezone to use when rendering the date within the migration file
# as well as the filename.
# If specified, requires the python-dateutil library that can be
# installed by adding `alembic[tz]` to the pip requirements
# string value is passed to dateutil.tz.gettz()
# leave blank for localtime
# timezone =

# max length of characters to apply to the
# "slug" field
# max_length = 40

# set to 'true' to run the environment during
# the 'revision' command, regardless of autogenerate
# revision_environment = false

# set to 'true' to allow .pyc and .pyo files without
# a source .py file to be detected as revisions in the
# versions/ directory
# sourceless = false

# version number format
# version_num_digits = 3

# version path separator; As mentioned above, this is the character used to split
# version_locations. The default within new alembic.ini files is "os", which uses
# os.pathsep. If this key is omitted entirely, it falls back to the legacy
# behavior of splitting on spaces and/or commas.
# Valid values for version_path_separator are:
#
# version_path_separator = :
# version_path_separator = ;
# version_path_separator = space
version_path_separator = os  # Use os.pathsep. Default configuration used for new projects.

# the output encoding used when revision files
# are written from script.py.mako
# output_encoding = utf-8

sqlalchemy.url = %(DATABASE_URL)s
```

### Alembic Environment Configuration
```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os

# Import your models here
from myapp.models import SQLModel

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target metadata
target_metadata = SQLModel.metadata

def get_url():
    return os.getenv("DATABASE_URL")

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        {
            "url": get_url(),
            "poolclass": pool.NullPool,
        },
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## Neon-Specific Optimizations

### Branch Management
Neon's branching feature allows for development workflows:
- Create branches for feature development
- Use branches for testing and staging
- Promote branches to production
- Isolate development environments

### Connection Efficiency
```python
# Optimize for Neon's serverless nature
class NeonConnectionManager:
    def __init__(self, database_url: str):
        self.engine = create_engine(
            database_url,
            pool_size=3,
            max_overflow=5,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False
        )

    def get_session(self):
        """Get a session with optimized settings for Neon"""
        return sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )()
```

## Error Handling and Retry Patterns

### Connection Retry Logic
```python
import time
import random
from sqlalchemy.exc import DisconnectionError, OperationalError

def execute_with_retry(func, max_retries=3, base_delay=1):
    """
    Execute function with exponential backoff retry logic
    """
    for attempt in range(max_retries):
        try:
            return func()
        except (DisconnectionError, OperationalError) as e:
            if attempt == max_retries - 1:
                raise e

            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)

    raise Exception("Max retries exceeded")
```

## Monitoring and Observability

### Connection Pool Monitoring
```python
def get_pool_stats(engine):
    """
    Get statistics about the connection pool
    """
    pool = engine.pool
    return {
        'checked_out': pool.checkedout(),
        'overflow': pool.overflow(),
        'size': pool.size(),
        'timeout': pool.timeout
    }
```

## Security Best Practices

### Credential Management
- Store credentials in environment variables
- Never commit credentials to version control
- Use Neon's built-in security features
- Implement proper SSL/TLS encryption
- Rotate credentials regularly

### Input Validation
- Use parameterized queries
- Validate all user inputs
- Implement proper data sanitization
- Use ORM features to prevent SQL injection