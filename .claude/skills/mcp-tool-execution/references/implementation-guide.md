# MCP Tool Execution Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing MCP (Model Context Protocol) tool execution with proper validation, deterministic execution, and tool-mediated AI enforcement.

## Step 1: Set Up MCP Server Infrastructure

### Install Required Dependencies
```bash
pip install mcp fastapi uvicorn jsonschema httpx
```

### Create Basic Server Structure
```python
# server.py
from mcp import FastMCP
from typing import Dict, Any
import jsonschema

def create_mcp_server():
    # Initialize MCP server
    mcp = FastMCP(name="my-mcp-server", stateless_http=True)

    return mcp.streamable_http_app()

if __name__ == "__main__":
    import uvicorn
    app = create_mcp_server()
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Step 2: Implement Tool Registration System

### Create Tool Registration Helper
```python
def register_tool(mcp, name: str, description: str, schema: dict, handler):
    """
    Register a tool with parameter validation
    """
    @mcp.tool(name=name, description=description)
    async def tool_handler(**kwargs):
        # Validate parameters
        validated_params = validate_parameters(kwargs, schema)

        # Execute tool deterministically
        result = await handler(**validated_params)

        return result

def validate_parameters(params: dict, schema: dict):
    """
    Validate parameters against JSON Schema
    """
    try:
        jsonschema.validate(params, schema)
        return params
    except jsonschema.ValidationError as e:
        raise ValueError(f"Parameter validation failed: {str(e)}")
```

### Register Sample Tools
```python
def create_mcp_server():
    mcp = FastMCP(name="my-mcp-server", stateless_http=True)

    # Define a sample tool schema
    hello_schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Name to greet"}
        },
        "required": ["name"]
    }

    # Define tool handler
    async def hello_handler(name: str):
        return f"Hello, {name}!"

    # Register the tool
    register_tool(
        mcp,
        "hello_world",
        "A simple greeting tool",
        hello_schema,
        hello_handler
    )

    return mcp.streamable_http_app()
```

## Step 3: Implement Deterministic Execution Patterns

### Create Execution Wrapper
```python
import asyncio
import logging
from typing import Callable, Any

async def execute_deteministically(
    func: Callable,
    params: dict,
    timeout: int = 30,
    max_retries: int = 3
):
    """
    Execute a function deterministically with error handling
    """
    for attempt in range(max_retries + 1):
        try:
            # Apply timeout
            result = await asyncio.wait_for(func(**params), timeout=timeout)

            # Log successful execution
            logging.info(f"Tool executed successfully: {func.__name__}")

            return {
                "success": True,
                "result": result,
                "attempt": attempt + 1
            }

        except asyncio.TimeoutError:
            if attempt == max_retries:
                return {
                    "success": False,
                    "error": "Tool execution timed out",
                    "type": "TIMEOUT"
                }
            continue

        except Exception as e:
            if attempt == max_retries:
                return {
                    "success": False,
                    "error": str(e),
                    "type": type(e).__name__
                }
            continue

    # This shouldn't be reached
    return {"success": False, "error": "Execution failed after retries"}
```

## Step 4: Implement Security and Access Control

### Create Access Control Layer
```python
from functools import wraps

def require_auth(func):
    """
    Decorator to require authentication for tool access
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract auth header (implement based on your auth system)
        auth_header = kwargs.pop('auth_token', None)

        if not auth_header:
            raise PermissionError("Authentication required")

        # Validate token (implement your token validation logic)
        if not validate_token(auth_header):
            raise PermissionError("Invalid authentication token")

        return await func(*args, **kwargs)

    return wrapper

def validate_token(token: str) -> bool:
    """
    Validate authentication token
    """
    # Implement your token validation logic
    # This is just a placeholder
    return token == "valid-token"
```

## Step 5: Implement Tool-Mediated AI Enforcement

### Create AI Interaction Controller
```python
class AIInteractionController:
    """
    Controls AI interactions to ensure they only happen through tools
    """

    def __init__(self):
        self.allowed_tools = set()
        self.interaction_log = []

    def register_tool(self, tool_name: str):
        """
        Register a tool as allowed for AI interactions
        """
        self.allowed_tools.add(tool_name)

    def is_allowed_interaction(self, tool_name: str) -> bool:
        """
        Check if a tool interaction is allowed
        """
        return tool_name in self.allowed_tools

    async def execute_interaction(self, tool_name: str, params: dict):
        """
        Execute an AI interaction through a registered tool
        """
        if not self.is_allowed_interaction(tool_name):
            raise PermissionError(f"Tool {tool_name} is not registered for AI interactions")

        # Log the interaction
        interaction_id = len(self.interaction_log)
        self.interaction_log.append({
            "id": interaction_id,
            "tool": tool_name,
            "params": params,
            "timestamp": asyncio.get_event_loop().time()
        })

        # Execute the tool (implementation depends on your tool registration system)
        # This is a placeholder for the actual tool execution
        return await self._execute_registered_tool(tool_name, params)

    async def _execute_registered_tool(self, tool_name: str, params: dict):
        """
        Execute a registered tool (placeholder implementation)
        """
        # This would call your actual tool execution system
        pass
```

## Step 6: Integrate with OpenAI Agent SDK

### Connect MCP Server to OpenAI
```python
import asyncio
from openai import OpenAI
from mcp_sdk import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def connect_mcp_to_openai():
    """
    Connect MCP server to OpenAI Agent SDK
    """
    # Initialize OpenAI client
    client = OpenAI()

    # Connect to MCP server
    mcp_params = MCPServerStreamableHttpParams(url="http://localhost:8000/mcp/")

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="MyMCPServer"
    ) as mcp_server:

        # The OpenAI agent will automatically discover tools from the MCP server
        response = await client.beta.chat.completions.parse.async_parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "user", "content": "Use available tools to greet John"}
            ],
            tools=[]  # MCP tools will be automatically included
        )

        return response
```

## Step 7: Add Monitoring and Observability

### Create Monitoring System
```python
import time
from datetime import datetime
from typing import Dict, Any

class MCPMonitoringSystem:
    """
    Monitor MCP tool executions and collect metrics
    """

    def __init__(self):
        self.metrics = {
            "tool_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "execution_times": []
        }
        self.execution_log = []

    async def monitor_execution(
        self,
        tool_name: str,
        params: dict,
        execution_func,
        *args,
        **kwargs
    ):
        """
        Monitor tool execution and collect metrics
        """
        start_time = time.time()

        try:
            result = await execution_func(*args, **kwargs)

            # Update metrics
            self.metrics["tool_executions"] += 1
            self.metrics["successful_executions"] += 1
            self.metrics["execution_times"].append(time.time() - start_time)

            # Log execution
            self.execution_log.append({
                "tool": tool_name,
                "success": True,
                "execution_time": time.time() - start_time,
                "timestamp": datetime.utcnow().isoformat(),
                "params_summary": self._sanitize_params(params)
            })

            return result

        except Exception as e:
            # Update metrics
            self.metrics["tool_executions"] += 1
            self.metrics["failed_executions"] += 1

            # Log failure
            self.execution_log.append({
                "tool": tool_name,
                "success": False,
                "execution_time": time.time() - start_time,
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "error_type": type(e).__name__
            })

            raise

    def _sanitize_params(self, params: dict) -> dict:
        """
        Remove sensitive information from params for logging
        """
        sanitized = params.copy()
        sensitive_keys = ["password", "token", "secret", "key"]

        for key in sensitive_keys:
            if key in sanitized:
                sanitized[key] = "***REDACTED***"

        return sanitized

    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get a summary of execution metrics
        """
        if not self.metrics["execution_times"]:
            avg_time = 0
        else:
            avg_time = sum(self.metrics["execution_times"]) / len(self.metrics["execution_times"])

        return {
            "total_executions": self.metrics["tool_executions"],
            "successful_executions": self.metrics["successful_executions"],
            "failed_executions": self.metrics["failed_executions"],
            "success_rate": (
                self.metrics["successful_executions"] / self.metrics["tool_executions"]
                if self.metrics["tool_executions"] > 0 else 0
            ),
            "average_execution_time": avg_time,
            "last_10_executions": self.execution_log[-10:]
        }
```

## Step 8: Testing and Validation

### Create Test Suite
```python
import unittest
import asyncio
from unittest.mock import Mock, AsyncMock

class TestMCPTools(unittest.TestCase):
    """
    Test suite for MCP tools
    """

    def setUp(self):
        self.controller = AIInteractionController()
        self.monitor = MCPMonitoringSystem()

    def test_tool_registration(self):
        """
        Test that tools can be registered and accessed
        """
        self.controller.register_tool("test_tool")
        self.assertTrue(self.controller.is_allowed_interaction("test_tool"))

    def test_parameter_validation(self):
        """
        Test parameter validation functionality
        """
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"}
            },
            "required": ["name"]
        }

        # Valid parameters
        valid_params = {"name": "John"}
        result = validate_parameters(valid_params, schema)
        self.assertEqual(result, valid_params)

        # Invalid parameters
        invalid_params = {"age": 30}
        with self.assertRaises(ValueError):
            validate_parameters(invalid_params, schema)

    @unittest.skip("Requires MCP server to be running")
    def test_end_to_end_execution(self):
        """
        Test end-to-end tool execution
        """
        # This would require a running MCP server
        pass

if __name__ == "__main__":
    unittest.main()
```

## Best Practices Summary

1. **Always validate parameters** against JSON Schema before processing
2. **Implement timeouts** for all tool executions to prevent hanging
3. **Use deterministic execution patterns** to ensure consistent results
4. **Implement proper error handling** with structured error responses
5. **Log all tool executions** for audit and debugging purposes
6. **Sanitize sensitive data** in logs and responses
7. **Use circuit breakers** for unreliable external services
8. **Monitor performance metrics** to detect issues early
9. **Follow naming conventions** to prevent conflicts in multi-server setups
10. **Ensure tool-mediated AI enforcement** by restricting direct access to underlying systems

This implementation guide provides a complete framework for building MCP tool execution systems that are secure, reliable, and maintainable.