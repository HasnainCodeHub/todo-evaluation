# REST API Design Official Documentation and Standards

## REST Fundamentals

### What is REST?
REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs follow these constraints:

1. **Client-Server**: Separation of concerns between client and server
2. **Stateless**: Each request contains all information needed
3. **Cacheable**: Responses indicate if they can be cached
4. **Uniform Interface**: Consistent API design patterns
5. **Layered System**: Client doesn't know if it's talking to server or intermediary
6. **Code on Demand**: Servers can temporarily extend client functionality (optional)

### RESTful Resource Naming Conventions
```
✅ Good resource naming:
- /users
- /users/123
- /users/123/orders
- /orders
- /products

❌ Bad resource naming:
- /getUsers
- /createUser
- /user/123/delete
- /getOrdersByUserId/123
```

## HTTP Methods and Semantics

### Standard HTTP Methods for REST APIs

| Method | Purpose | Safe | Idempotent | Payload | Response |
|--------|---------|------|------------|---------|----------|
| **GET** | Retrieve resource(s) | ✅ | ✅ | No | 200 (OK), 404 (Not Found) |
| **POST** | Create new resource | ❌ | ❌ | Yes | 201 (Created), 202 (Accepted) |
| **PUT** | Update/replace resource | ❌ | ✅ | Yes | 200 (OK), 204 (No Content) |
| **PATCH** | Partial resource update | ❌ | ❌ | Yes | 200 (OK), 202 (Accepted) |
| **DELETE** | Remove resource | ❌ | ✅ | No | 204 (No Content), 202 (Accepted) |

### HTTP Method Usage Guidelines

#### GET Requests
```javascript
// ✅ Correct: Safe and idempotent operations
GET /users                    // Get all users
GET /users/123               // Get specific user
GET /users?status=active     // Get users with query params
GET /users/123/orders        // Get related resources

// ❌ Wrong: Modifying resources with GET
GET /users/123/activate      // Should use POST/PATCH/PUT
GET /users/123/delete        // Should use DELETE
```

#### POST Requests
```javascript
// ✅ Correct: Creating new resources
POST /users
{
  "name": "John Doe",
  "email": "john@example.com"
}

// ✅ Correct: Non-idempotent operations
POST /users/123/orders        // Create order for user
POST /payments/123/process    // Process payment
```

#### PUT Requests
```javascript
// ✅ Correct: Complete resource replacement
PUT /users/123
{
  "id": 123,
  "name": "Jane Smith",
  "email": "jane@example.com"
}

// ✅ Correct: Idempotent operations
// Multiple identical PUT requests should have same effect
```

#### PATCH Requests
```javascript
// ✅ Correct: Partial resource updates
PATCH /users/123
{
  "name": "Jane Smith"
}

// ✅ Correct: Using JSON Patch format
PATCH /users/123
[
  { "op": "replace", "path": "/name", "value": "Jane Smith" },
  { "op": "remove", "path": "/email" }
]
```

## HTTP Status Codes

### Success Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| **200 OK** | Success | GET, PUT, PATCH requests |
| **201 Created** | Successfully created | POST requests |
| **202 Accepted** | Request accepted for processing | Async operations |
| **204 No Content** | Success, no content | DELETE, PUT requests where no response body needed |

### Client Error Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| **400 Bad Request** | Invalid request | Malformed JSON, invalid parameters |
| **401 Unauthorized** | Authentication required | Missing/invalid credentials |
| **403 Forbidden** | Access denied | Insufficient permissions |
| **404 Not Found** | Resource doesn't exist | Unknown resource ID |
| **405 Method Not Allowed** | HTTP method not supported | Using POST on GET-only endpoint |
| **409 Conflict** | Resource conflict | Duplicate email, username |
| **422 Unprocessable Entity** | Validation failed | Business rule violations |
| **429 Too Many Requests** | Rate limit exceeded | API rate limiting |

### Server Error Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| **500 Internal Server Error** | Generic server error | Unexpected server errors |
| **502 Bad Gateway** | Upstream server error | Proxy/gateway errors |
| **503 Service Unavailable** | Service temporarily down | Maintenance, overload |
| **504 Gateway Timeout** | Upstream timeout | Gateway timeout |

## Resource Design Patterns

### Singular vs Plural Resource Names
```javascript
// ✅ Good: Consistent plural naming
GET /users          // Collection of users
GET /users/123      // Specific user
GET /users/123/orders  // Sub-resources

// ❌ Bad: Inconsistent naming
GET /user           // Singular inconsistent
GET /users/123      // Plural collection
```

### Nested Resource Relationships
```javascript
// ✅ Good: Clear relationship representation
GET /users/123/orders           // User's orders
POST /users/123/orders          // Create order for user
GET /users/123/orders/456       // Specific order for user
PUT /users/123/orders/456       // Update specific order

// ✅ Good: Multiple levels of nesting (keep shallow)
GET /users/123/orders/456/items
POST /users/123/orders/456/items

// ❌ Bad: Deep nesting (avoid more than 2-3 levels)
GET /users/123/orders/456/items/789/reviews/101
```

### Collection Operations
```javascript
// ✅ Good: Standard collection endpoints
GET /users                    // List users (with pagination/filtering)
POST /users                   // Create user
GET /users/123               // Get specific user
PUT /users/123               // Replace user
PATCH /users/123             // Update user partially
DELETE /users/123            // Delete user
```

## Query Parameters and Filtering

### Standard Query Parameters
```javascript
// ✅ Good: Standardized parameter names
GET /users?sort=name&order=asc&page=1&limit=10&status=active
GET /products?category=electronics&price_min=100&price_max=500
GET /orders?date_from=2023-01-01&date_to=2023-12-31&status=pending
```

### Filtering Conventions
```javascript
// ✅ Good: Consistent filtering patterns
GET /users?status=active&role=admin           // Multiple filters
GET /users?q=search_term                      // Full-text search
GET /users?fields=id,name,email              // Field selection
GET /users?include=orders,profile            // Related resource inclusion
```

## Request/Response Body Design

### Standard Request Formats
```javascript
// ✅ Good: Consistent request structure
POST /users
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "metadata": {
    "source": "web_signup"
  }
}

// ✅ Good: Bulk operations
POST /users/bulk
{
  "users": [
    {
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

### Standard Response Formats
```javascript
// ✅ Good: Consistent response structure
GET /users/123
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2023-01-15T10:30:00Z"
}

// ✅ Good: Collection response with metadata
GET /users?page=1&limit=10
{
  "data": [
    {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

## Error Response Design

### Standard Error Format
```javascript
// ✅ Good: Consistent error response format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Email format is invalid"
      },
      {
        "field": "password",
        "code": "TOO_SHORT",
        "message": "Password must be at least 8 characters"
      }
    ],
    "timestamp": "2023-01-15T10:30:00Z",
    "request_id": "abc123def456"
  }
}

// ✅ Good: Simple error format
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with ID 123 not found"
  }
}
```

### HTTP Status Code Mapping
```javascript
// Example error handling patterns
app.get('/users/:id', (req, res) => {
  const user = getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: {
        code: "USER_NOT_FOUND",
        message: `User with ID ${req.params.id} not found`
      }
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      error: {
        code: "USER_INACTIVE",
        message: "User account is inactive"
      }
    });
  }

  res.json(user);
});
```

## Pagination Patterns

### Offset-Based Pagination
```javascript
// ✅ Good: Standard offset pagination
GET /users?page=2&limit=20
// Returns users 21-40

// Response
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 1000,
    "pages": 50,
    "has_next": true,
    "has_prev": true
  }
}
```

### Cursor-Based Pagination
```javascript
// ✅ Good: Cursor-based for better performance
GET /users?cursor=abc123&limit=20
// More reliable for large datasets

// Response
{
  "data": [...],
  "pagination": {
    "cursor": "def456",
    "has_more": true
  }
}
```

## Versioning Strategies

### URI Versioning
```javascript
// ✅ Good: Clear version in URI
GET /api/v1/users
POST /api/v2/users
```

### Header Versioning
```javascript
// ✅ Good: Version in header
GET /users
Accept: application/vnd.myapi.v1+json

// Or
GET /users
X-API-Version: 1.0
```

### Query Parameter Versioning
```javascript
// ✅ Good: Version in query
GET /users?version=1.0
```

## API Documentation Standards

### OpenAPI Specification Example
```yaml
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
  description: API for managing users

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email
      required:
        - id
        - name
        - email
```

These standards ensure consistent, predictable, and well-documented REST APIs that follow industry best practices.