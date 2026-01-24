# REST API Design Troubleshooting Guide

## Common Issues and Solutions

### 1. HTTP Method Misuse
**Problem**: Using wrong HTTP methods for operations
**Symptoms**: GET requests modifying data, POST for retrieval, inconsistent behavior
**Solutions**:
- Use GET for safe, idempotent operations (retrieval)
- Use POST for creating resources or non-idempotent operations
- Use PUT for complete resource replacement
- Use PATCH for partial updates
- Use DELETE for removal

```python
# ❌ Wrong: Using GET for modifications
@app.get("/users/{user_id}/activate")
def activate_user(user_id: int):
    # This modifies data - should not be GET
    user = crud.user.activate(db, user_id)
    return user

# ✅ Correct: Using appropriate method
@app.patch("/users/{user_id}")
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db)
):
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.user.update(db, db_obj=user, obj_in=status_update)
```

### 2. Status Code Misuse
**Problem**: Returning inappropriate status codes
**Symptoms**: 200 for errors, 404 for validation errors, 500 for client errors
**Solutions**:
- Use 4xx for client errors, 5xx for server errors
- Use specific codes: 400 for bad request, 401 for auth, 403 for forbidden
- Return 201 for successful creation, 204 for successful deletion

### 3. Resource Naming Issues
**Problem**: Inconsistent or non-RESTful resource naming
**Symptoms**: Verb-based URLs, inconsistent pluralization, deep nesting
**Solutions**:
- Use noun-based resource names (users, orders, products)
- Use consistent pluralization
- Keep nesting shallow (avoid more than 2-3 levels)

## Debugging Steps

### Step 1: Validate API Design Against REST Principles
```bash
# Check if endpoints follow REST conventions
# Example validation script
import requests

def validate_rest_api(base_url):
    endpoints = [
        ("/users", "GET"),      # Should return list
        ("/users", "POST"),     # Should create user
        ("/users/1", "GET"),    # Should return specific user
        ("/users/1", "PUT"),    # Should update user
        ("/users/1", "DELETE"), # Should delete user
    ]

    for endpoint, method in endpoints:
        url = base_url + endpoint
        response = requests.request(method, url)

        # Validate status codes
        expected_codes = {
            ("GET", "/users"): [200, 404],
            ("POST", "/users"): [201, 400, 409],
            ("GET", "/users/1"): [200, 404],
            ("PUT", "/users/1"): [200, 404, 400],
            ("DELETE", "/users/1"): [204, 404],
        }

        if response.status_code not in expected_codes.get((method, endpoint), []):
            print(f"❌ {method} {endpoint}: Expected {expected_codes[(method, endpoint)]}, got {response.status_code}")
        else:
            print(f"✅ {method} {endpoint}: {response.status_code}")
```

### Step 2: Check HTTP Method Semantics
```python
# Verify HTTP method compliance
def check_method_semantics():
    """
    Verify that methods follow semantic guidelines:
    - GET: Safe and idempotent
    - PUT: Idempotent resource replacement
    - DELETE: Idempotent resource removal
    - POST: Non-idempotent operations
    """
    pass
```

### Step 3: Validate Status Code Usage
```python
# Status code validation
def validate_status_codes():
    """
    Validate that status codes are used appropriately:
    2xx: Success
    4xx: Client errors
    5xx: Server errors
    """
    pass
```

## Error Messages and Solutions

### "405 Method Not Allowed"
**Cause**: HTTP method not supported for the endpoint
**Solutions**:
- Check if the endpoint supports the requested method
- Verify method mapping in the route definition
- Ensure the correct method is being used in the request

### "404 Not Found" for existing resources
**Cause**: Resource identification issues
**Solutions**:
- Verify resource ID exists in the database
- Check if authentication/authorization allows access to the resource
- Validate resource path construction

### "400 Bad Request" with no details
**Cause**: Poor error reporting
**Solutions**:
- Implement detailed validation error responses
- Return specific field validation errors
- Provide clear error messages

```python
# ❌ Bad: Generic error message
raise HTTPException(status_code=400, detail="Bad request")

# ✅ Good: Detailed error response
raise HTTPException(
    status_code=400,
    detail={
        "error": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": [
            {"field": "email", "message": "Invalid email format"},
            {"field": "age", "message": "Must be greater than 0"}
        ]
    }
)
```

### "500 Internal Server Error" for client issues
**Cause**: Server errors returned for client issues
**Solutions**:
- Use 4xx codes for client-side problems
- Use 5xx codes only for genuine server errors
- Implement proper error classification

## Development vs Production Differences

### Environment Configuration
```python
# app/config.py
import os

class APISettings:
    def __init__(self):
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.rate_limit_enabled = not self.debug  # Disable in development
        self.detailed_errors = self.debug  # More detailed errors in development
        self.log_level = "DEBUG" if self.debug else "INFO"
```

### Error Response Differences
```python
# app/api/error_handlers.py
from fastapi import Request
from fastapi.responses import JSONResponse
from traceback import format_exception
import sys

async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle general exceptions differently in dev vs prod
    """
    if settings.debug:
        # Include detailed error information in development
        error_details = {
            "error": "INTERNAL_ERROR",
            "message": str(exc),
            "traceback": "".join(format_exception(type(exc), exc, exc.__traceback__))
        }
    else:
        # Return generic error in production
        error_details = {
            "error": "INTERNAL_ERROR",
            "message": "An internal server error occurred"
        }

    return JSONResponse(
        status_code=500,
        content=error_details
    )
```

## Testing REST API Design

### Unit Tests for API Design
```python
# tests/test_api_design.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_restful_endpoints():
    """Test that endpoints follow REST conventions"""
    # Test collection endpoint
    response = client.get("/users")
    assert response.status_code in [200, 401, 403]

    # Test creation endpoint
    response = client.post("/users", json={"name": "Test User"})
    assert response.status_code in [201, 400, 401, 403, 409]

    # Test individual resource endpoint
    response = client.get("/users/1")
    assert response.status_code in [200, 401, 403, 404]

    # Test update endpoint
    response = client.put("/users/1", json={"name": "Updated Name"})
    assert response.status_code in [200, 400, 401, 403, 404]

    # Test delete endpoint
    response = client.delete("/users/1")
    assert response.status_code in [204, 401, 403, 404]

def test_http_method_semantics():
    """Test that HTTP methods follow semantic guidelines"""
    # GET should be safe (not modify resources)
    response1 = client.get("/users/1")
    response2 = client.get("/users/1")
    assert response1.json() == response2.json()  # Same result

    # PUT should be idempotent
    update_data = {"name": "Test Name"}
    response1 = client.put("/users/1", json=update_data)
    response2 = client.put("/users/1", json=update_data)
    assert response1.status_code == response2.status_code

def test_status_code_consistency():
    """Test that status codes are used consistently"""
    # Test 404 for non-existent resources
    response = client.get("/users/999999")
    assert response.status_code == 404

    # Test 400 for validation errors
    response = client.post("/users", json={"invalid_field": "value"})
    assert response.status_code == 400

    # Test 201 for successful creation
    response = client.post("/users", json={"name": "New User", "email": "new@example.com"})
    assert response.status_code == 201
```

### Integration Tests
```python
# tests/test_api_integration.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import get_db
from app import crud

def test_full_resource_lifecycle():
    """Test complete CRUD lifecycle follows REST principles"""
    client = TestClient(app)

    # 1. CREATE - POST should return 201
    create_response = client.post("/users", json={
        "name": "Test User",
        "email": "test@example.com"
    })
    assert create_response.status_code == 201
    created_user = create_response.json()
    user_id = created_user["id"]

    # 2. READ - GET should return 200
    read_response = client.get(f"/users/{user_id}")
    assert read_response.status_code == 200
    assert read_response.json()["id"] == user_id

    # 3. UPDATE - PUT should return 200
    update_response = client.put(f"/users/{user_id}", json={
        "name": "Updated User",
        "email": "updated@example.com"
    })
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated User"

    # 4. DELETE - DELETE should return 204
    delete_response = client.delete(f"/users/{user_id}")
    assert delete_response.status_code == 204

    # 5. VERIFY - GET should return 404 after deletion
    verify_response = client.get(f"/users/{user_id}")
    assert verify_response.status_code == 404
```

## Performance Debugging

### API Response Time Analysis
```python
# utils/api_profiler.py
import time
import requests
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List

def profile_api_endpoints(base_url: str, endpoints: List[str], num_requests: int = 10):
    """
    Profile API endpoint response times
    """
    results = {}

    def time_request(endpoint: str):
        start_time = time.time()
        try:
            response = requests.get(f"{base_url}{endpoint}")
            end_time = time.time()
            return {
                "status": response.status_code,
                "response_time": end_time - start_time,
                "success": response.status_code == 200
            }
        except Exception as e:
            end_time = time.time()
            return {
                "status": None,
                "response_time": end_time - start_time,
                "success": False,
                "error": str(e)
            }

    for endpoint in endpoints:
        times = []
        errors = []

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(time_request, endpoint) for _ in range(num_requests)]
            for future in futures:
                result = future.result()
                if result["success"]:
                    times.append(result["response_time"])
                else:
                    errors.append(result["error"])

        if times:
            results[endpoint] = {
                "avg_response_time": sum(times) / len(times),
                "min_response_time": min(times),
                "max_response_time": max(times),
                "success_rate": len(times) / num_requests,
                "errors": errors
            }

    return results

# Usage
endpoints = ["/users", "/users/1", "/products", "/orders"]
performance_results = profile_api_endpoints("http://localhost:8000", endpoints)
for endpoint, stats in performance_results.items():
    print(f"{endpoint}: Avg={stats['avg_response_time']:.3f}s, Success={stats['success_rate']:.1%}")
```

## Security Troubleshooting

### Authentication and Authorization Issues
```python
# troubleshoot security issues
def check_security_headers(response):
    """
    Check for proper security headers
    """
    security_headers = [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Strict-Transport-Security"
    ]

    missing = []
    for header in security_headers:
        if header not in response.headers:
            missing.append(header)

    if missing:
        print(f"⚠️  Missing security headers: {missing}")
    else:
        print("✅ All security headers present")

def test_auth_requirements():
    """
    Test that endpoints properly require authentication
    """
    endpoints = [
        ("/users", "GET"),
        ("/users", "POST"),
        ("/users/1", "GET"),
        ("/users/1", "PUT"),
        ("/users/1", "DELETE")
    ]

    client = TestClient(app)

    for endpoint, method in endpoints:
        # Test without authentication
        response = getattr(client, method.lower())(endpoint)

        # Most endpoints should require authentication
        if method in ["POST", "PUT", "DELETE"] or "1" in endpoint:
            if response.status_code not in [401, 403, 404]:  # Allow 404 for non-existent resources
                print(f"⚠️  {method} {endpoint} should require authentication but got {response.status_code}")
            else:
                print(f"✅ {method} {endpoint} properly requires authentication")
```

## Common Misconfigurations

### Incorrect HTTP Method Assignment
❌ Bad:
```python
# ❌ Wrong: Using GET to modify data
@router.get("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.user.get(db, id=user_id)
    user.is_active = True
    db.commit()
    return user
```

✅ Good:
```python
# ✅ Correct: Using PATCH for partial updates
@router.patch("/users/{user_id}")
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db)
):
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.user.update_status(db, db_obj=user, obj_in=status_update)
```

### Improper Status Code Usage
❌ Bad:
```python
# ❌ Wrong: Returning 200 for errors
@router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.user.get_by_email(db, email=user.email)
    if existing_user:
        return {"error": "User already exists", "status": "failed"}  # 200 with error!
    return crud.user.create(db, obj_in=user)
```

✅ Good:
```python
# ✅ Correct: Proper status codes
@router.post("/users", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.user.get_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="User with this email already exists"
        )
    return crud.user.create(db, obj_in=user)
```

### Violating HTTP Method Semantics
❌ Bad:
```python
# ❌ Wrong: GET modifying data
@router.get("/users/{user_id}/increment_views")
def increment_user_views(user_id: int, db: Session = Depends(get_db)):
    user = crud.user.get(db, id=user_id)
    user.view_count += 1
    db.commit()
    return user
```

✅ Good:
```python
# ✅ Correct: Using POST for state-changing operations
@router.post("/users/{user_id}/increment_views")
def increment_user_views(user_id: int, db: Session = Depends(get_db)):
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.view_count += 1
    db.commit()
    return {"view_count": user.view_count}
```

## Monitoring and Observability

### API Design Compliance Monitoring
```python
# utils/api_compliance_monitor.py
import logging
from fastapi import Request, Response
from typing import Dict, Any

logger = logging.getLogger(__name__)

class APIDesignMonitor:
    def __init__(self):
        self.non_compliant_requests = []

    def check_rest_compliance(self, request: Request, response: Response) -> Dict[str, Any]:
        """
        Check if request/response follows REST principles
        """
        compliance_issues = []

        # Check method semantics
        if request.method == "GET" and response.status_code >= 400:
            compliance_issues.append("GET method should not return error status codes")

        # Check status code appropriateness
        if request.method == "POST" and response.status_code == 200:
            compliance_issues.append("POST should return 201 for successful creation")

        # Check resource naming (basic check)
        path_parts = request.url.path.split("/")
        for part in path_parts:
            if part and any(verb in part.lower() for verb in ["get", "create", "update", "delete", "modify"]):
                compliance_issues.append(f"Resource name contains verb: {part}")

        return {
            "compliant": len(compliance_issues) == 0,
            "issues": compliance_issues,
            "request_method": request.method,
            "response_status": response.status_code,
            "request_path": request.url.path
        }

    def log_non_compliant_request(self, request: Request, response: Response):
        """
        Log requests that don't follow REST principles
        """
        compliance_check = self.check_rest_compliance(request, response)

        if not compliance_check["compliant"]:
            self.non_compliant_requests.append({
                "timestamp": time.time(),
                "request": {
                    "method": request.method,
                    "path": request.url.path,
                    "headers": dict(request.headers)
                },
                "response": {
                    "status": response.status_code,
                    "headers": dict(response.headers)
                },
                "issues": compliance_check["issues"]
            })

            logger.warning(f"Non-compliant API request: {compliance_check}")
```

## Recovery Procedures

### API Design Refactoring
```python
# recovery/api_refactor.py
def refactor_non_restful_endpoint(old_method: str, old_path: str, new_method: str, new_path: str):
    """
    Helper to refactor non-RESTful endpoints
    """
    print(f"Refactoring: {old_method} {old_path} -> {new_method} {new_path}")

    # Steps for refactoring:
    # 1. Create new endpoint with proper REST design
    # 2. Deprecate old endpoint with warning headers
    # 3. Redirect old requests (temporarily) with 301/307
    # 4. Update documentation
    # 5. Update client applications
    # 6. Remove old endpoint after transition period
    pass

# Example of graceful endpoint migration
@router.get("/get_user/{user_id}")  # Old endpoint
def get_user_old(user_id: int):
    """
    DEPRECATED: Use GET /users/{user_id} instead
    """
    response = client.get(f"/users/{user_id}")

    # Add deprecation headers
    response.headers["Warning"] = '299 - "This endpoint is deprecated"'
    response.headers["Location"] = f"/users/{user_id}"

    return response
```

### Status Code Correction
```python
# recovery/status_code_fixer.py
def fix_status_code_usage():
    """
    Identify and fix improper status code usage
    """
    # Search for common patterns of incorrect status code usage
    incorrect_patterns = [
        "return {'error': ...}  # 200 with error",
        "raise HTTPException(404) for validation errors",  # Should be 400 or 422
        "return 200 for successful creation"  # Should be 201
    ]

    print("Review your API endpoints for these patterns:")
    for pattern in incorrect_patterns:
        print(f"  - {pattern}")
```

These troubleshooting patterns will help diagnose and resolve common REST API design issues effectively.