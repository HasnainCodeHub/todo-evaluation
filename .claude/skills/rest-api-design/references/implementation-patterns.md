# REST API Design Implementation Patterns

## API Design Patterns

### Resource-Oriented Design
```python
# ✅ Good: Resource-oriented API design
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Retrieve users with pagination and filtering
    """
    filters = {}
    if search:
        filters["search"] = search
    if status:
        filters["status"] = status

    users = crud.user.get_multi(db, skip=skip, limit=limit, **filters)
    return users

@router.post("/", response_model=schemas.User, status_code=201)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create new user
    """
    db_user = crud.user.get_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )
    return crud.user.create(db=db, obj_in=user)

@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Get specific user by ID
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update user completely (PUT - replace entire resource)
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.user.update(db=db, db_obj=user, obj_in=user_update)

@router.patch("/{user_id}", response_model=schemas.User)
def partial_update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Partially update user (PATCH - partial update)
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert to dict and exclude unset values for partial update
    update_data = user_update.model_dump(exclude_unset=True)
    return crud.user.update(db=db, db_obj=user, obj_in=update_data)

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Delete user (204 No Content on success)
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    crud.user.remove(db=db, id=user_id)
    return  # 204 No Content
```

### Nested Resource Patterns
```python
# ✅ Good: Nested resource relationships
# app/api/v1/users_orders.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter(tags=["user-orders"])

@router.get("/users/{user_id}/orders", response_model=List[schemas.Order])
def read_user_orders(
    user_id: int,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all orders for a specific user
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders = crud.order.get_multi_by_user(
        db, user_id=user_id, skip=skip, limit=limit
    )
    return orders

@router.post("/users/{user_id}/orders", response_model=schemas.Order, status_code=201)
def create_user_order(
    user_id: int,
    order: schemas.OrderCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create new order for a specific user
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Ensure order belongs to the user
    order.user_id = user_id
    return crud.order.create(db=db, obj_in=order)

@router.get("/users/{user_id}/orders/{order_id}", response_model=schemas.Order)
def read_user_order(
    user_id: int,
    order_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Get specific order for a specific user
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    order = crud.order.get_by_user_and_id(db, user_id=user_id, order_id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for user")

    return order
```

## HTTP Status Code Implementation Patterns

### Status Code Mapping
```python
# ✅ Good: Consistent status code usage
# app/api/v1/errors.py
from fastapi import HTTPException, status
from typing import Dict, Any

class APIError:
    @staticmethod
    def not_found(resource: str, identifier: str = None) -> HTTPException:
        """Resource not found (404)"""
        detail = f"{resource} not found"
        if identifier:
            detail += f" with ID {identifier}"
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

    @staticmethod
    def conflict(resource: str, field: str, value: str) -> HTTPException:
        """Conflict error (409)"""
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource} with {field} '{value}' already exists"
        )

    @staticmethod
    def validation_error(errors: Dict[str, str]) -> HTTPException:
        """Validation error (422)"""
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": errors}
        )

    @staticmethod
    def unauthorized(detail: str = "Unauthorized") -> HTTPException:
        """Unauthorized error (401)"""
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )

    @staticmethod
    def forbidden(detail: str = "Forbidden") -> HTTPException:
        """Forbidden error (403)"""
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )
```

### Error Response Format
```python
# ✅ Good: Consistent error response format
# app/schemas/error.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: dict
    timestamp: datetime = datetime.utcnow()
    request_id: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Usage in API
from fastapi import Request
import uuid

@router.post("/users/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(deps.get_db)
):
    try:
        # Check for duplicate email
        existing_user = crud.user.get_by_email(db, email=user.email)
        if existing_user:
            error_detail = ErrorResponse(
                error={
                    "code": "DUPLICATE_EMAIL",
                    "message": f"User with email {user.email} already exists"
                },
                request_id=str(uuid.uuid4())
            )
            raise HTTPException(
                status_code=409,
                detail=error_detail.dict()
            )

        return crud.user.create(db=db, obj_in=user)

    except ValueError as e:
        error_detail = ErrorResponse(
            error={
                "code": "VALIDATION_ERROR",
                "message": str(e)
            },
            request_id=str(uuid.uuid4())
        )
        raise HTTPException(
            status_code=422,
            detail=error_detail.dict()
        )
```

## Query Parameter Implementation Patterns

### Filtering and Pagination
```python
# ✅ Good: Consistent query parameter handling
# app/schemas/filters.py
from pydantic import BaseModel, validator
from typing import Optional, List
from enum import Enum

class SortDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"

class BaseFilter(BaseModel):
    page: int = 1
    limit: int = 100
    sort: Optional[str] = None
    order: SortDirection = SortDirection.ASC
    search: Optional[str] = None

    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            raise ValueError('Page must be greater than 0')
        return v

    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 1000:
            raise ValueError('Limit must be between 1 and 1000')
        return v

class UserFilter(BaseFilter):
    status: Optional[str] = None
    role: Optional[str] = None
    email_domain: Optional[str] = None

# app/crud/user.py
def get_multi_with_filters(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    **filters
) -> tuple[List[models.User], int]:
    """
    Get users with filters and return total count
    """
    query = db.query(models.User)

    # Apply filters
    if filters.get('status'):
        query = query.filter(models.User.status == filters['status'])

    if filters.get('role'):
        query = query.filter(models.User.role == filters['role'])

    if filters.get('search'):
        search_term = f"%{filters['search']}%"
        query = query.filter(
            or_(
                models.User.name.ilike(search_term),
                models.User.email.ilike(search_term)
            )
        )

    # Apply sorting
    sort_field = filters.get('sort', 'id')
    sort_direction = filters.get('order', 'asc')

    if hasattr(models.User, sort_field):
        sort_column = getattr(models.User, sort_field)
        if sort_direction == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

    # Get total count
    total = query.count()

    # Apply pagination
    users = query.offset(skip).limit(limit).all()

    return users, total
```

## Response Format Patterns

### Consistent Response Structure
```python
# ✅ Good: Consistent response structure
# app/schemas/responses.py
from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional, Union
from datetime import datetime

T = TypeVar('T')

class BaseResponse(BaseModel):
    success: bool = True
    timestamp: datetime = datetime.utcnow()

class ItemResponse(BaseResponse, Generic[T]):
    data: T

class ListResponse(BaseResponse, Generic[T]):
    data: List[T]
    pagination: dict

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Usage in API
@router.get("/users/{user_id}", response_model=ItemResponse[schemas.User])
def read_user(
    user_id: int,
    db: Session = Depends(deps.get_db)
):
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return ItemResponse(data=user)

@router.get("/users", response_model=ListResponse[schemas.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100
):
    users, total = crud.user.get_multi_with_filters(
        db, skip=skip, limit=limit
    )

    pagination = {
        "page": (skip // limit) + 1,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "has_next": skip + limit < total,
        "has_prev": skip > 0
    }

    return ListResponse(data=users, pagination=pagination)
```

## Authentication and Authorization Patterns

### API Security Implementation
```python
# ✅ Good: Secure API patterns
# app/api/v1/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app import crud, models
from app.database.session import get_db
from app.auth.jwt import verify_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Get current authenticated user
    """
    token = credentials.credentials
    payload = verify_token(token)
    user_id: int = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = crud.user.get(db, id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

def require_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Require admin role for access
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_permission(permission: str):
    """
    Create dependency for specific permission
    """
    def permission_dependency(
        current_user: models.User = Depends(get_current_user)
    ) -> models.User:
        if permission not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return permission_dependency
```

### Secured Endpoints
```python
# ✅ Good: Proper authorization on endpoints
@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user - only accessible to the user themselves or admins
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user can access this resource
    if user.id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(require_admin_user),  # Admin required
    db: Session = Depends(get_db)
):
    """
    Update user - admin only
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.user.update(db=db, db_obj=user, obj_in=user_update)
```

## Versioning Implementation

### API Versioning Patterns
```python
# ✅ Good: API versioning strategies
# app/api/v1/api.py
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])

# app/api/v2/api.py
from fastapi import APIRouter

api_router_v2 = APIRouter()

# V2 might have different response formats
@router.get("/users/{user_id}")
def read_user_v2(
    user_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    V2 endpoint with richer response format
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Enhanced response format for V2
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "profile": {
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "location": user.location
        },
        "stats": {
            "total_orders": user.total_orders,
            "last_login": user.last_login
        },
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

# Alternative: Header-based versioning
from fastapi import Header
from typing import Optional

@router.get("/users/{user_id}")
def read_user_by_version(
    user_id: int,
    accept: Optional[str] = Header(None),
    db: Session = Depends(deps.get_db)
):
    """
    Version content based on Accept header
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check version from header
    if accept and "vnd.myapi.v2" in accept:
        # Return V2 format
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "extended_profile": {
                "bio": user.bio,
                "social_links": user.social_links
            }
        }
    else:
        # Return V1 format
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
```

## Rate Limiting Patterns

### API Rate Limiting Implementation
```python
# ✅ Good: Rate limiting for API endpoints
# app/middleware/rate_limit.py
import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status
from typing import Dict, Deque

class RateLimiter:
    def __init__(self, max_requests: int, window_size: int):
        self.max_requests = max_requests
        self.window_size = window_size
        self.requests: Dict[str, Deque[float]] = defaultdict(deque)

    def is_allowed(self, identifier: str) -> bool:
        current_time = time.time()

        # Clean old requests outside the window
        while (self.requests[identifier] and
               current_time - self.requests[identifier][0] > self.window_size):
            self.requests[identifier].popleft()

        if len(self.requests[identifier]) >= self.max_requests:
            return False

        self.requests[identifier].append(current_time)
        return True

# Global rate limiters
user_rate_limiter = RateLimiter(max_requests=100, window_size=60)  # 100 req/min
api_key_rate_limiter = RateLimiter(max_requests=1000, window_size=60)  # 1000 req/min

async def rate_limit_middleware(request: Request, call_next):
    # Extract client IP
    client_ip = request.client.host

    if not user_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    response = await call_next(request)
    return response

# Per-endpoint rate limiting
@router.get("/users/{user_id}")
def read_user_with_rate_limit(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host

    if not user_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
```

## Caching Patterns

### API Response Caching
```python
# ✅ Good: Caching for API responses
# app/cache.py
import json
import redis
from typing import Optional, Any
from app.config import settings

redis_client = redis.Redis.from_url(settings.redis_url)

def get_cached_response(cache_key: str) -> Optional[Any]:
    """Get cached response"""
    cached_data = redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)
    return None

def set_cached_response(cache_key: str, data: Any, ttl: int = 300) -> None:
    """Cache response with TTL"""
    redis_client.setex(cache_key, ttl, json.dumps(data))

# API with caching
@router.get("/users/{user_id}")
def read_user_with_cache(
    user_id: int,
    db: Session = Depends(get_db)
):
    cache_key = f"user:{user_id}"

    # Try to get from cache first
    cached_user = get_cached_response(cache_key)
    if cached_user:
        return cached_user

    # Fetch from database
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cache the result
    user_dict = user.model_dump()
    set_cached_response(cache_key, user_dict, ttl=300)  # 5 minutes

    return user
```

These implementation patterns provide a comprehensive guide for building RESTful APIs with proper design principles, security, and performance considerations.