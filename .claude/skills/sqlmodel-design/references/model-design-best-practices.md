# SQLModel Design Best Practices

## Basic Model Design

### Table Declaration
When creating models that need to be persisted to the database, always use `table=True`:

```python
from sqlmodel import SQLModel, Field
import uuid

# Correct - Model will be created as a database table
class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})

# Incorrect - Model won't be created as a table, only for validation
class User(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str
```

### Primary Key Best Practices
Use UUIDs for primary keys in most cases for better security and distribution:

```python
import uuid
from sqlmodel import SQLModel, Field

class BaseModel(SQLModel):
    """Base model with UUID primary key."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

class User(BaseModel, table=True):
    """User model inheriting UUID primary key."""
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})
```

For performance-critical scenarios where UUID overhead is a concern, integers can be used:

```python
from sqlmodel import SQLModel, Field

class FastUser(SQLModel, table=True):
    """User model with integer primary key for performance."""
    id: int = Field(primary_key=True, default=None)  # Auto-increment
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})
```

## Field Definitions

### String Fields
Always specify constraints for string fields:

```python
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    # For unique identifiers
    email: str = Field(
        unique=True,
        sa_column_kwargs={
            "nullable": False,
            "max_length": 255
        }
    )

    # For optional text fields
    bio: str = Field(
        default=None,
        max_length=1000
    )

    # For required text fields
    full_name: str = Field(
        sa_column_kwargs={
            "nullable": False,
            "max_length": 255
        }
    )
```

### Numeric Fields
Specify precision and scale for decimal fields, constraints for integers:

```python
from decimal import Decimal
from sqlmodel import SQLModel, Field
from typing import Optional

class Product(SQLModel, table=True):
    price: Decimal = Field(
        sa_column_kwargs={
            "nullable": False,
            "scale": 2,      # 2 decimal places
            "precision": 10  # Total of 10 digits
        }
    )

    quantity: int = Field(
        default=0,
        sa_column_kwargs={
            "nullable": False
        }
    )

    rating: Optional[float] = Field(
        default=None,
        ge=0,    # Greater than or equal to 0
        le=5     # Less than or equal to 5
    )
```

### Boolean Fields
Always provide sensible defaults for boolean fields:

```python
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    email_notifications_enabled: bool = Field(default=True)
```

## Relationship Patterns

### One-to-Many Relationships
Define both sides of the relationship for proper ORM functionality:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import List
import uuid

class Category(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})

    # One-to-many: Category has many Products
    products: List["Product"] = Relationship(back_populates="category")

class Product(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})

    # Foreign key to Category
    category_id: uuid.UUID = Field(foreign_key="category.id", sa_column_kwargs={"nullable": False})

    # Relationship back-reference
    category: Category = Relationship(back_populates="products")
```

### Many-to-Many Relationships
Use association tables for many-to-many relationships:

```python
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Table, Column, ForeignKey
from typing import List
import uuid

# Association table
team_member_association = Table(
    "team_member",
    SQLModel.metadata,
    Column("team_id", uuid.UUID, ForeignKey("team.id")),
    Column("user_id", uuid.UUID, ForeignKey("user.id"))
)

class Team(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})

    # Many-to-many relationship
    members: List["User"] = Relationship(
        back_populates="teams",
        link_model=team_member_association
    )

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(sa_column_kwargs={"nullable": False})

    # Many-to-many relationship
    teams: List[Team] = Relationship(
        back_populates="members",
        link_model=team_member_association
    )
```

## Validation Patterns

### Field-Level Validation
Use Pydantic's field validators for custom validation:

```python
from pydantic import field_validator
from sqlmodel import SQLModel, Field
from typing import Optional
import re

class User(SQLModel, table=True):
    email: str = Field(sa_column_kwargs={"nullable": False})
    age: Optional[int] = Field(default=None, ge=0, le=150)
    phone: Optional[str] = Field(default=None)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v.lower()

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            # Remove all non-digit characters
            digits_only = re.sub(r'\D', '', v)
            if len(digits_only) < 10 or len(digits_only) > 15:
                raise ValueError('Phone number must be between 10 and 15 digits')
        return v
```

### Model-Level Validation
Use `@model_validator` for validation that involves multiple fields:

```python
from pydantic import model_validator
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Event(SQLModel, table=True):
    title: str = Field(sa_column_kwargs={"nullable": False})
    start_date: datetime = Field(sa_column_kwargs={"nullable": False})
    end_date: datetime = Field(sa_column_kwargs={"nullable": False})
    registration_deadline: Optional[datetime] = Field(default=None)

    @model_validator(mode='before')
    @classmethod
    def validate_dates(cls, values):
        if 'start_date' in values and 'end_date' in values:
            if values['start_date'] > values['end_date']:
                raise ValueError('Start date must be before end date')

        if 'registration_deadline' in values and values['start_date'] and values['registration_deadline'] > values['start_date']:
            raise ValueError('Registration deadline must be before start date')

        return values
```

## Indexing and Performance

### Single Field Indexes
Use the `index=True` parameter for frequently queried fields:

```python
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    # Frequently searched field
    email: str = Field(unique=True, index=True, sa_column_kwargs={"nullable": False})

    # Often filtered field
    status: str = Field(default="active", index=True, sa_column_kwargs={"nullable": False})

    # Date range queries
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
```

### Composite Indexes
Create composite indexes for common query patterns:

```python
from sqlmodel import SQLModel, Field
from sqlalchemy import Index

class Order(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.id", sa_column_kwargs={"index": True})
    status: str = Field(default="pending", sa_column_kwargs={"index": True})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"index": True})

    # Composite index for common query: "get all pending orders for user ordered by date"
    __table_args__ = (
        Index('ix_order_user_status_created', 'user_id', 'status', 'created_at'),
        Index('ix_order_status_created', 'status', 'created_at'),  # For status-based queries
    )
```

## Timestamp Management

### Timestamp Mixins
Create reusable timestamp mixins for consistent timestamp handling:

```python
from sqlmodel import Field
from datetime import datetime

class TimestampMixin:
    """Mixin to add timestamp fields to models."""
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"nullable": False}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"nullable": False}
    )

class User(TimestampMixin, SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})

class Product(TimestampMixin, SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(sa_column_kwargs={"nullable": False})
```

### Automatic Updated Timestamps
Use SQLAlchemy events to automatically update the `updated_at` field:

```python
from sqlalchemy import event
from datetime import datetime

@event.listens_for(SQLModel, 'before_update', propagate=True)
def set_updated_at_timestamp(mapper, connection, target):
    """Automatically update the updated_at timestamp before any update."""
    if hasattr(target, 'updated_at'):
        target.updated_at = datetime.utcnow()
```

## API Model Patterns

### Model Inheritance for API Layers
Create different model variants for different API purposes:

```python
from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from typing import Optional
import uuid

# Base model with common fields
class UserBase(SQLModel):
    email: str
    full_name: Optional[str] = None

# Database model with all fields
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str = Field(sa_column_kwargs={"nullable": False})
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# API input models
class UserCreate(UserBase):
    password: str  # Plain text password for hashing

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

# API response models
class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
```

### Security-Focused Model Variants
Never expose sensitive fields in API responses:

```python
class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(sa_column_kwargs={"nullable": False})
    hashed_password: str = Field(sa_column_kwargs={"nullable": False})  # Never expose
    salt: str = Field(sa_column_kwargs={"nullable": False})  # Never expose
    verification_token: str = Field(sa_column_kwargs={"nullable": False})  # Never expose

    is_active: bool = Field(default=False)
    is_verified: bool = Field(default=False)

class UserResponse(BaseModel):
    """Safe response model that doesn't expose sensitive fields."""
    id: uuid.UUID
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime

class UserCreate(BaseModel):
    """Input model for user creation."""
    email: str
    password: str  # Will be hashed, never stored as plain text
    full_name: Optional[str] = None
```

## Migration Considerations

### Schema Evolution Patterns
Plan for schema changes from the beginning:

```python
# Version 1 - Initial schema
class UserV1(SQLModel, table=True):
    id: int = Field(primary_key=True)
    email: str = Field(sa_column_kwargs={"nullable": False})
    name: str = Field(sa_column_kwargs={"nullable": False})  # Poor field name

# Version 2 - Improved schema
class UserV2(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)  # Changed from int
    email: str = Field(sa_column_kwargs={"nullable": False})
    full_name: str = Field(sa_column_kwargs={"nullable": False})  # Better field name
    is_active: bool = Field(default=True)  # Added field

    # Migration strategy:
    # 1. Add new 'full_name' column
    # 2. Copy data from 'name' to 'full_name'
    # 3. Add new 'is_active' column with default
    # 4. Eventually drop old 'name' column in separate migration
```

Following these best practices ensures that your SQLModel schemas are robust, performant, and maintainable.