# MCP Tool Execution and Deterministic Patterns

## Deterministic Execution Principles

### Idempotency
Ensuring that tools produce the same result when called multiple times with the same parameters:

```python
async def idempotent_user_lookup(user_id: str) -> dict:
    """
    Lookup user data - always returns the same result for the same user_id
    """
    # Read-only operation that doesn't change system state
    user_data = await database.fetch_user(user_id)
    return {
        "id": user_data.id,
        "name": user_data.name,
        "email": user_data.email,
        "created_at": user_data.created_at.isoformat()
    }
```

### State Independence
Tools should not rely on external state that might change between executions:

```python
# ❌ Bad - relies on external mutable state
current_config = {"debug": True}

async def bad_tool():
    if current_config["debug"]:
        return "debug mode"
    return "normal mode"

# ✅ Good - all state passed as parameters
async def good_tool(debug_mode: bool = False):
    if debug_mode:
        return "debug mode"
    return "normal mode"
```

## Safe Execution Patterns

### Isolated Execution Environment
```python
import asyncio
import signal
from contextlib import asynccontextmanager

@asynccontextmanager
async def execution_context(timeout: int = 30):
    """Create isolated execution context with timeout"""
    # Set up execution environment
    task_local = asyncio.current_task()

    try:
        # Apply timeout
        result = await asyncio.wait_for(task_local.coro, timeout=timeout)
        yield result
    except asyncio.TimeoutError:
        raise TimeoutError(f"Tool execution timed out after {timeout}s")
    finally:
        # Cleanup
        pass

async def execute_with_timeout(tool_func, params: dict, timeout: int = 30):
    """Execute tool with timeout protection"""
    try:
        async with execution_context(timeout):
            return await tool_func(**params)
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}
```

### Resource Management
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def resource_limiter(max_memory: int = 100 * 1024 * 1024):  # 100MB
    """Limit resource usage during tool execution"""
    initial_memory = get_current_memory_usage()

    if initial_memory > max_memory:
        raise ResourceError("Insufficient memory available")

    try:
        yield
    finally:
        # Cleanup resources if needed
        pass

async def safe_tool_execution(tool_func, params: dict):
    """Execute tool with resource limits"""
    async with resource_limiter():
        return await tool_func(**params)
```

## Error Handling and Recovery

### Structured Error Responses
```python
from enum import Enum
from typing import Union, Dict, Any

class ErrorCode(Enum):
    VALIDATION_ERROR = "validation_error"
    EXECUTION_ERROR = "execution_error"
    TIMEOUT_ERROR = "timeout_error"
    PERMISSION_ERROR = "permission_error"
    RESOURCE_ERROR = "resource_error"

def create_error_response(error_code: ErrorCode, message: str, details: dict = None):
    """Create standardized error response"""
    return {
        "success": False,
        "error": {
            "code": error_code.value,
            "message": message,
            "details": details or {}
        }
    }

async def execute_with_error_handling(tool_func, params: dict):
    """Execute tool with comprehensive error handling"""
    try:
        result = await tool_func(**params)
        return {
            "success": True,
            "result": result
        }
    except ValidationError as e:
        return create_error_response(
            ErrorCode.VALIDATION_ERROR,
            str(e),
            {"invalid_params": e.invalid_params}
        )
    except PermissionError as e:
        return create_error_response(
            ErrorCode.PERMISSION_ERROR,
            str(e)
        )
    except asyncio.TimeoutError as e:
        return create_error_response(
            ErrorCode.TIMEOUT_ERROR,
            f"Operation timed out: {str(e)}"
        )
    except Exception as e:
        # Log the actual error for debugging but return generic message
        log_error(f"Unexpected error in tool execution: {str(e)}", exc_info=True)
        return create_error_response(
            ErrorCode.EXECUTION_ERROR,
            "An unexpected error occurred during execution"
        )
```

## Retry and Circuit Breaker Patterns

### Retry Logic
```python
import random
import asyncio
from typing import Callable, Type, Tuple

async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    retry_on: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Execute function with exponential backoff retry
    """
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except retry_on as e:
            if attempt == max_retries:
                raise e

            # Calculate delay with jitter
            delay = min(base_delay * (backoff_factor ** attempt), max_delay)
            jitter = random.uniform(0, delay * 0.1)
            await asyncio.sleep(delay + jitter)

    raise RuntimeError("Retry logic failed - this should not happen")
```

### Circuit Breaker
```python
import time
from enum import Enum
from typing import Optional

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Tripped, blocking calls
    HALF_OPEN = "half_open" # Testing if failure condition resolved

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None

    async def call(self, func, *args, **kwargs):
        """Execute function through circuit breaker"""
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time >= self.timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpenError("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)

            if self.state == CircuitState.HALF_OPEN:
                # Success in half-open state resets the breaker
                self._reset()

            return result

        except Exception as e:
            self._record_failure()
            raise e

    def _record_failure(self):
        """Record a failure and update state"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def _reset(self):
        """Reset the circuit breaker"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None

class CircuitBreakerOpenError(Exception):
    pass
```

## Audit Trail and Monitoring

### Execution Logging
```python
import uuid
import time
from datetime import datetime
from typing import Dict, Any

class ExecutionLogger:
    def __init__(self):
        self.logger = get_logger(__name__)

    async def log_execution(
        self,
        tool_name: str,
        params: Dict[str, Any],
        result: Dict[str, Any],
        execution_time: float
    ):
        """Log tool execution for audit trail"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "execution_id": str(uuid.uuid4()),
            "tool_name": tool_name,
            "execution_time_ms": execution_time * 1000,
            "success": result.get("success", False),
            "params_summary": self._sanitize_params(params),
            "result_summary": self._sanitize_result(result)
        }

        self.logger.info(f"MCP Tool Execution: {log_entry}")

    def _sanitize_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from params for logging"""
        sanitized = params.copy()
        sensitive_keys = ["password", "token", "secret", "key"]

        for key in sensitive_keys:
            if key in sanitized:
                sanitized[key] = "***REDACTED***"

        return sanitized

    def _sanitize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from result for logging"""
        if not isinstance(result, dict):
            return result

        sanitized = result.copy()
        if "error" in sanitized and isinstance(sanitized["error"], dict):
            # Sanitize error details
            error_copy = sanitized["error"].copy()
            if "details" in error_copy:
                error_copy["details"] = str(error_copy["details"])
            sanitized["error"] = error_copy

        return sanitized

# Usage in execution wrapper
async def execute_with_logging(tool_func, tool_name: str, params: dict):
    logger = ExecutionLogger()
    start_time = time.time()

    try:
        result = await tool_func(**params)
        execution_time = time.time() - start_time
        await logger.log_execution(tool_name, params, result, execution_time)
        return result
    except Exception as e:
        execution_time = time.time() - start_time
        error_result = {"success": False, "error": str(e)}
        await logger.log_execution(tool_name, params, error_result, execution_time)
        raise
```

## Parallel Execution Safety

### Concurrency Control
```python
import asyncio
from asyncio import Semaphore

class ConcurrencyController:
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = Semaphore(max_concurrent)

    async def execute_with_limit(self, tool_func, *args, **kwargs):
        """Execute tool with concurrency limit"""
        async with self.semaphore:
            return await tool_func(*args, **kwargs)

# Global controller instance
concurrency_controller = ConcurrencyController(max_concurrent=5)

async def execute_safely(tool_func, *args, **kwargs):
    """Execute tool with concurrency and safety controls"""
    return await concurrency_controller.execute_with_limit(
        tool_func, *args, **kwargs
    )
```

These patterns ensure that MCP tools execute deterministically, safely, and with proper error handling and monitoring.