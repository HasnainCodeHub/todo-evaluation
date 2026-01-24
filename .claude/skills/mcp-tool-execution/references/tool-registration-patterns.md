# MCP Tool Registration Patterns

## Basic Tool Registration

### Decorator-Based Registration
```python
from mcp import FastMCP

mcp = FastMCP(name="example-server", stateless_http=True)

@mcp.tool(
    name="hello_world",
    description="Simple greeting tool"
)
async def hello_world_tool(name: str) -> str:
    """Basic tool implementation"""
    return f"Hello, {name}!"
```

### Programmatic Registration
```python
def register_tools_dynamically(mcp_instance, tool_definitions):
    """Register multiple tools programmatically"""
    for tool_def in tool_definitions:
        @mcp_instance.tool(
            name=tool_def['name'],
            description=tool_def['description']
        )
        async def dynamic_tool(**kwargs):
            # Validate parameters
            validated_params = validate_params(kwargs, tool_def['schema'])

            # Execute the implementation
            return await tool_def['implementation'](**validated_params)

    return mcp_instance
```

## Parameter Validation Patterns

### JSON Schema Validation
```python
import jsonschema
from typing import Dict, Any

def validate_params(params: Dict[str, Any], schema: Dict) -> Dict[str, Any]:
    """Validate parameters against JSON schema"""
    try:
        jsonschema.validate(params, schema)
        return params
    except jsonschema.ValidationError as e:
        raise ValueError(f"Parameter validation failed: {str(e)}")

# Example schema
USER_QUERY_SCHEMA = {
    "type": "object",
    "properties": {
        "query": {
            "type": "string",
            "description": "Search query string"
        },
        "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10
        }
    },
    "required": ["query"]
}
```

### Type Hint Validation
```python
from typing import Optional, List
import inspect

def validate_type_hints(func, **kwargs):
    """Validate arguments using type hints"""
    sig = inspect.signature(func)
    bound_args = sig.bind(**kwargs)
    bound_args.apply_defaults()

    # Validate each argument against its type hint
    for param_name, value in bound_args.arguments.items():
        param = sig.parameters[param_name]
        expected_type = param.annotation

        if expected_type != inspect.Parameter.empty:
            if not isinstance(value, expected_type):
                raise TypeError(
                    f"Parameter '{param_name}' expected {expected_type}, "
                    f"got {type(value)}"
                )

    return bound_args.arguments
```

## Advanced Registration Patterns

### Conditional Tool Registration
```python
def register_conditional_tools(mcp_instance, config):
    """Register tools based on configuration"""
    if config.get('enable_database_access'):
        @mcp_instance.tool(
            name="query_database",
            description="Query the application database"
        )
        async def query_db(query: str, params: Optional[List] = None):
            # Database access implementation
            pass

    if config.get('enable_file_access'):
        @mcp_instance.tool(
            name="read_file",
            description="Read a file from the filesystem"
        )
        async def read_file(path: str):
            # File access implementation
            pass

    return mcp_instance
```

### Plugin System for Tools
```python
class ToolRegistry:
    """Manage dynamic tool registration"""

    def __init__(self):
        self.tools = {}
        self.mcp_instance = None

    def register(self, name: str, schema: dict, func):
        """Register a tool with schema and function"""
        self.tools[name] = {
            'schema': schema,
            'function': func,
            'name': name
        }

        # If MCP instance exists, register immediately
        if self.mcp_instance:
            self._register_with_mcp(name, schema, func)

    def _register_with_mcp(self, name: str, schema: dict, func):
        """Actually register with MCP instance"""
        @self.mcp_instance.tool(name=name, description=schema.get('description', ''))
        async def tool_wrapper(**kwargs):
            validated_params = validate_params(kwargs, schema)
            return await func(**validated_params)

    def attach_to_mcp(self, mcp_instance):
        """Attach all registered tools to MCP instance"""
        self.mcp_instance = mcp_instance
        for tool_info in self.tools.values():
            self._register_with_mcp(
                tool_info['name'],
                tool_info['schema'],
                tool_info['function']
            )
```

## Validation Strategies

### Comprehensive Parameter Validation
```python
def comprehensive_validate(params: dict, schema: dict, context: dict = None):
    """Comprehensive validation with context awareness"""
    # 1. Schema validation
    validate_params(params, schema)

    # 2. Business rule validation
    if context and 'business_rules' in context:
        for rule in context['business_rules']:
            if not rule.validate(params):
                raise ValueError(f"Business rule violation: {rule.description}")

    # 3. Permission validation
    if context and 'permissions' in context:
        user_perms = context['permissions']
        required_perms = schema.get('required_permissions', [])
        if not all(perm in user_perms for perm in required_perms):
            raise PermissionError("Insufficient permissions")

    # 4. Rate limiting check
    if context and 'rate_limiter' in context:
        if not context['rate_limiter'].check_rate_limit(schema['name']):
            raise ValueError("Rate limit exceeded")

    return params
```

### Default Value Handling
```python
def apply_defaults(params: dict, schema: dict) -> dict:
    """Apply default values from schema to parameters"""
    result = params.copy()

    if 'properties' in schema:
        for prop_name, prop_def in schema['properties'].items():
            if prop_name not in result and 'default' in prop_def:
                result[prop_name] = prop_def['default']

    return result
```

## Error Handling in Registration

### Graceful Failure Modes
```python
def safe_register_tool(mcp_instance, name: str, schema: dict, func, fallback=None):
    """Register a tool with fallback capability"""
    try:
        @mcp_instance.tool(name=name, description=schema.get('description', ''))
        async def tool_wrapper(**kwargs):
            try:
                validated_params = validate_params(kwargs, schema)
                return await func(**validated_params)
            except Exception as e:
                if fallback:
                    # Attempt fallback execution
                    return await fallback(str(e), **kwargs)
                else:
                    raise
    except Exception as e:
        print(f"Failed to register tool {name}: {e}")
        # Optionally register a stub tool that returns error
        if fallback:
            @mcp_instance.tool(name=name, description="Stub tool due to registration error")
            async def stub_tool(**kwargs):
                return {"error": f"Tool temporarily unavailable: {str(e)}"}
```

These patterns ensure robust, validated tool registration with proper error handling and flexibility.