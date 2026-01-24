# SQLModel Validation and Security Patterns

## Field Validation Patterns

### Built-in Field Validators
Use Pydantic's built-in validators for common field types:

```python
from pydantic import field_validator, EmailStr, HttpUrl
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import re

class User(SQLModel, table=True):
    """User model with built-in field validations."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Email validation with Pydantic's EmailStr
    email: EmailStr = Field(unique=True, sa_column_kwargs={"nullable": False})

    # URL validation
    website: Optional[HttpUrl] = Field(default=None)

    # String length constraints
    bio: Optional[str] = Field(default=None, max_length=500)

    # Numeric range constraints
    age: Optional[int] = Field(default=None, ge=0, le=150)  # Greater than/equal to 0, less than/equal to 150
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)

    # Pattern validation
    phone: Optional[str] = Field(default=None)

    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v):
        """Validate phone number format."""
        if v:
            # Remove all non-digit characters
            digits_only = re.sub(r'\D', '', v)
            if len(digits_only) < 10 or len(digits_only) > 15:
                raise ValueError('Phone number must be between 10 and 15 digits')
        return v

    @field_validator('bio')
    @classmethod
    def validate_bio_content(cls, v):
        """Validate bio content."""
        if v:
            if len(v.strip()) < 10:
                raise ValueError('Bio must be at least 10 characters')
            if len(v) > 500:
                raise ValueError('Bio must not exceed 500 characters')
        return v
```

### Custom Validation Mixins
Create reusable validation logic using mixins:

```python
from pydantic import field_validator
from typing import Optional

class PasswordValidationMixin:
    """Mixin for password validation."""

    @staticmethod
    def validate_password_strength(password: str) -> str:
        """Validate password strength requirements."""
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters long')

        if not any(c.isupper() for c in password):
            raise ValueError('Password must contain at least one uppercase letter')

        if not any(c.islower() for c in password):
            raise ValueError('Password must contain at least one lowercase letter')

        if not any(c.isdigit() for c in password):
            raise ValueError('Password must contain at least one digit')

        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            raise ValueError('Password must contain at least one special character')

        return password

class UsernameValidationMixin:
    """Mixin for username validation."""

    @staticmethod
    def validate_username_format(username: str) -> str:
        """Validate username format."""
        if not username:
            raise ValueError('Username cannot be empty')

        if len(username) < 3:
            raise ValueError('Username must be at least 3 characters')

        if len(username) > 30:
            raise ValueError('Username must not exceed 30 characters')

        # Only allow alphanumeric, underscore, and hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise ValueError('Username can only contain letters, numbers, underscore, and hyphen')

        return username.lower()

class User(PasswordValidationMixin, UsernameValidationMixin, SQLModel, table=True):
    """User model with validation mixins."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: EmailStr = Field(unique=True, sa_column_kwargs={"nullable": False})
    username: str = Field(unique=True, sa_column_kwargs={"nullable": False, "max_length": 30})
    password: str = Field(sa_column_kwargs={"nullable": False})

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        return cls.validate_password_strength(v)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        return cls.validate_username_format(v)
```

### Model-Level Validation
Use model validators for validation that involves multiple fields:

```python
from pydantic import model_validator
from sqlmodel import SQLModel, Field
from datetime import datetime, timedelta
from typing import Optional

class Event(SQLModel, table=True):
    """Event model with model-level validation."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False, "max_length": 200})
    description: Optional[str] = Field(default=None)
    start_date: datetime = Field(sa_column_kwargs={"nullable": False})
    end_date: datetime = Field(sa_column_kwargs={"nullable": False})
    registration_deadline: Optional[datetime] = Field(default=None)
    is_private: bool = Field(default=False)
    max_attendees: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode='before')
    @classmethod
    def validate_date_constraints(cls, values):
        """Validate date-related constraints."""
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        registration_deadline = values.get('registration_deadline')

        if start_date and end_date:
            if start_date >= end_date:
                raise ValueError('Start date must be before end date')

        if start_date and registration_deadline:
            if registration_deadline >= start_date:
                raise ValueError('Registration deadline must be before start date')

        # Event should not be in the past
        if start_date and start_date < datetime.utcnow():
            raise ValueError('Event start date cannot be in the past')

        return values

    @model_validator(mode='after')
    def validate_attendee_constraints(self):
        """Validate attendee-related constraints."""
        if self.is_private and self.max_attendees and self.max_attendees > 100:
            raise ValueError('Private events cannot have more than 100 attendees')

        if not self.is_private and self.max_attendees and self.max_attendees < 10:
            raise ValueError('Public events must have at least 10 maximum attendees')

        return self
```

## Security Patterns

### Input Sanitization
Sanitize inputs to prevent injection attacks:

```python
import html
import bleach
from sqlmodel import SQLModel, Field
from typing import Optional

class Post(SQLModel, table=True):
    """Post model with input sanitization."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False, "max_length": 200})
    content: str = Field(sa_column_kwargs={"nullable": False})
    summary: Optional[str] = Field(default=None)

    @field_validator('title', 'content', 'summary')
    @classmethod
    def sanitize_input(cls, v):
        """Sanitize input to prevent XSS and other injection attacks."""
        if v is None:
            return v

        # Remove potentially dangerous HTML tags
        clean_v = bleach.clean(
            v,
            tags=['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            attributes={'a': ['href', 'title'], 'img': ['src', 'alt']},
            strip=True
        )

        # Escape remaining HTML characters
        clean_v = html.escape(clean_v)

        return clean_v
```

### Field Exposure Control
Control which fields are exposed in different contexts:

```python
from pydantic import BaseModel
from sqlmodel import SQLModel, Field
from typing import Optional
import uuid

class User(SQLModel, table=True):
    """Full user model with all fields."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(sa_column_kwargs={"nullable": False})
    full_name: Optional[str] = Field(default=None)
    hashed_password: str = Field(sa_column_kwargs={"nullable": False})  # Never expose
    salt: str = Field(sa_column_kwargs={"nullable": False})  # Never expose
    verification_token: Optional[str] = Field(default=None)  # Never expose directly
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Different response models for different contexts
class UserPublic(BaseModel):
    """Public user information."""
    id: uuid.UUID
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

class UserProtected(BaseModel):
    """Protected user information (for own account)."""
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

class UserAdmin(BaseModel):
    """Full user information (admin access)."""
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    """User creation input."""
    email: str
    full_name: Optional[str] = None
    password: str  # Will be hashed, never stored as plain text

class UserUpdate(BaseModel):
    """User update input."""
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None  # Will be hashed if provided
```

### Role-Based Field Access
Implement role-based access to fields:

```python
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class Post(SQLModel, table=True):
    """Post model with role-based field access."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(sa_column_kwargs={"nullable": False})
    content: str = Field(sa_column_kwargs={"nullable": False})
    author_id: uuid.UUID = Field(foreign_key="user.id", sa_column_kwargs={"nullable": False})

    # Sensitive fields
    moderation_notes: Optional[str] = Field(default=None)  # Only for moderators/admins
    internal_flags: Optional[str] = Field(default=None)   # Only for admins

    # Status fields
    status: str = Field(default="draft", sa_column_kwargs={"nullable": False})  # draft, published, archived, flagged
    is_pinned: bool = Field(default=False)

# Different serializers for different roles
class PostPublicSerializer(BaseModel):
    """Public post serializer."""
    id: uuid.UUID
    title: str
    content: str
    author_id: uuid.UUID
    status: str
    is_pinned: bool

class PostModeratorSerializer(BaseModel):
    """Moderator post serializer."""
    id: uuid.UUID
    title: str
    content: str
    author_id: uuid.UUID
    status: str
    is_pinned: bool
    moderation_notes: Optional[str]

class PostAdminSerializer(BaseModel):
    """Admin post serializer."""
    id: uuid.UUID
    title: str
    content: str
    author_id: uuid.UUID
    status: str
    is_pinned: bool
    moderation_notes: Optional[str]
    internal_flags: Optional[str]
```

## API Security Patterns

### Rate Limiting Models
Include fields for rate limiting and abuse prevention:

```python
class User(SQLModel, table=True):
    """User model with rate limiting fields."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})
    full_name: Optional[str] = Field(default=None)

    # Rate limiting fields
    request_count_today: int = Field(default=0, sa_column_kwargs={"nullable": False})
    last_request_at: Optional[datetime] = Field(default=None)
    rate_limit_reset_at: Optional[datetime] = Field(default=None)

    # Account security
    failed_login_attempts: int = Field(default=0, sa_column_kwargs={"nullable": False})
    locked_until: Optional[datetime] = Field(default=None)
    password_reset_token: Optional[str] = Field(default=None)
    password_reset_expires: Optional[datetime] = Field(default=None)

    def increment_request_count(self):
        """Increment daily request counter."""
        today = datetime.utcnow().date()
        if not self.rate_limit_reset_at or self.rate_limit_reset_at.date() < today:
            self.request_count_today = 1
            self.rate_limit_reset_at = datetime.combine(today, datetime.max.time())
        else:
            self.request_count_today += 1

        self.last_request_at = datetime.utcnow()
```

### Audit Trail Models
Include audit trails for security and compliance:

```python
class AuditLog(SQLModel, table=True):
    """Audit trail for security and compliance."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    action: str = Field(sa_column_kwargs={"nullable": False})  # create, update, delete, login, etc.
    resource_type: str = Field(sa_column_kwargs={"nullable": False})  # user, post, comment, etc.
    resource_id: uuid.UUID = Field(sa_column_kwargs={"nullable": False})
    user_id: Optional[uuid.UUID] = Field(default=None)  # Who performed the action
    ip_address: Optional[str] = Field(default=None)  # IP of the request
    user_agent: Optional[str] = Field(default=None)  # Browser/device info
    old_values: Optional[dict] = Field(default=None, sa_column=sa.Column(JSON))  # Previous values
    new_values: Optional[dict] = Field(default=None, sa_column=sa.Column(JSON))  # New values
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    success: bool = Field(default=True)  # Whether the action was successful

# Mixin for audit trail support
class AuditableMixin:
    """Mixin to add audit trail support to models."""
    created_by: Optional[uuid.UUID] = Field(default=None)
    updated_by: Optional[uuid.UUID] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SecureUser(AuditableMixin, SQLModel, table=True):
    """User model with audit trail."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})
    full_name: Optional[str] = Field(default=None)

    def update_audit_fields(self, user_id: uuid.UUID):
        """Update audit fields."""
        self.updated_by = user_id
        self.updated_at = datetime.utcnow()
```

## Data Protection Patterns

### Encryption at Rest
Patterns for encrypting sensitive data:

```python
from cryptography.fernet import Fernet
import base64
from sqlmodel import SQLModel, Field
from typing import Optional

class EncryptedField:
    """Descriptor for encrypted fields."""
    def __init__(self, key_env_var: str):
        self.key = base64.urlsafe_b64encode(
            os.environ[key_env_var].encode()[:32].ljust(32, b'0')
        )
        self.cipher_suite = Fernet(self.key)

    def __set_name__(self, owner, name):
        self.name = f"_{name}"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        encrypted_value = getattr(obj, self.name, None)
        if encrypted_value:
            decrypted_value = self.cipher_suite.decrypt(encrypted_value.encode()).decode()
            return decrypted_value
        return None

    def __set__(self, obj, value):
        if value:
            encrypted_value = self.cipher_suite.encrypt(value.encode()).decode()
            setattr(obj, self.name, encrypted_value)
        else:
            setattr(obj, self.name, None)

class SensitiveUser(SQLModel, table=True):
    """User model with encrypted sensitive fields."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, sa_column_kwargs={"nullable": False})

    # Encrypted sensitive fields
    _ssn_encrypted: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})  # Encrypted
    _credit_card_encrypted: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})  # Encrypted

    # Property to access encrypted fields
    @property
    def ssn(self) -> Optional[str]:
        if self._ssn_encrypted:
            return Fernet(encryption_key).decrypt(self._ssn_encrypted.encode()).decode()
        return None

    @ssn.setter
    def ssn(self, value: str):
        if value:
            self._ssn_encrypted = Fernet(encryption_key).encrypt(value.encode()).decode()
        else:
            self._ssn_encrypted = None
```

These validation and security patterns help ensure that your SQLModel applications are robust, secure, and follow best practices for data integrity and protection.