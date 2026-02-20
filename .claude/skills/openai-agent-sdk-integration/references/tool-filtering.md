# Tool Filtering Patterns

## Overview

Tool filtering allows you to control which MCP tools are available to agents. This is essential for:
- Access control (restricting tools per user role)
- Security (blocking dangerous operations)
- Performance (reducing tool discovery overhead)
- Context-awareness (showing relevant tools only)

## Static Tool Filtering

### Using create_static_tool_filter

```python
from agents.mcp import (
    MCPServerStreamableHttp,
    MCPServerStreamableHttpParams,
    create_static_tool_filter
)

# Allow only specific tools
allow_filter = create_static_tool_filter(
    allowed_tool_names=["read_data", "list_items"]
)

# Block specific tools
block_filter = create_static_tool_filter(
    blocked_tool_names=["delete_all", "admin_operation"]
)

# Combined: allow some, block others
combined_filter = create_static_tool_filter(
    allowed_tool_names=["read_data", "write_data", "delete_data"],
    blocked_tool_names=["delete_data"]  # Override: block delete
)
```

### Applying Static Filter

```python
async def main():
    tool_filter = create_static_tool_filter(
        allowed_tool_names=["safe_tool_1", "safe_tool_2"]
    )

    mcp_params = MCPServerStreamableHttpParams(url="http://localhost:8001/mcp/")

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="FilteredClient",
        tool_filter=tool_filter  # Apply filter
    ) as mcp_server:
        # List tools to verify filtering
        tools = await mcp_server.list_tools(run_context=object(), agent=object())
        print(f"Available tools: {[t.name for t in tools]}")
```

## Dynamic Tool Filtering

### Basic Dynamic Filter

```python
from agents.mcp import ToolFilterContext

def dynamic_filter(context: ToolFilterContext, tool) -> bool:
    """Filter tools based on runtime conditions."""
    # Only allow tools starting with "read_"
    return tool.name.startswith("read_")
```

### Context-Aware Filter

```python
from agents.mcp import ToolFilterContext

def context_aware_filter(context: ToolFilterContext, tool) -> bool:
    """Filter tools based on agent context."""
    # Access agent information
    agent_name = context.agent.name

    # Different tools for different agents
    if agent_name == "AdminAgent":
        return True  # Admin gets all tools
    elif agent_name == "ReadOnlyAgent":
        return tool.name.startswith("read_") or tool.name.startswith("list_")
    else:
        # Default: only safe operations
        return tool.name in ["get_info", "list_items"]
```

### User-Based Filter

```python
from agents.mcp import ToolFilterContext
from dataclasses import dataclass

@dataclass
class UserContext:
    user_id: str
    role: str
    permissions: list[str]

def user_role_filter(context: ToolFilterContext, tool) -> bool:
    """Filter tools based on user role."""
    # Access user context from run context
    user_ctx: UserContext = context.run_context.context

    # Admin: all tools
    if user_ctx.role == "admin":
        return True

    # Editor: read + write, no delete
    if user_ctx.role == "editor":
        return not tool.name.startswith("delete_")

    # Viewer: read only
    if user_ctx.role == "viewer":
        return tool.name.startswith("read_") or tool.name.startswith("list_")

    return False
```

### Permission-Based Filter

```python
# Tool to permission mapping
TOOL_PERMISSIONS = {
    "create_task": "tasks:create",
    "read_task": "tasks:read",
    "update_task": "tasks:update",
    "delete_task": "tasks:delete",
    "admin_panel": "admin:access"
}

def permission_filter(context: ToolFilterContext, tool) -> bool:
    """Filter tools based on user permissions."""
    user_ctx = context.run_context.context

    # Get required permission for tool
    required_permission = TOOL_PERMISSIONS.get(tool.name)

    if required_permission is None:
        return False  # Unknown tools are blocked

    # Check if user has permission
    return required_permission in user_ctx.permissions
```

## Combining Filters

### Filter Composition

```python
def compose_filters(*filters):
    """Compose multiple filters with AND logic."""
    def combined_filter(context: ToolFilterContext, tool) -> bool:
        return all(f(context, tool) for f in filters)
    return combined_filter

def compose_filters_or(*filters):
    """Compose multiple filters with OR logic."""
    def combined_filter(context: ToolFilterContext, tool) -> bool:
        return any(f(context, tool) for f in filters)
    return combined_filter

# Usage
admin_filter = lambda ctx, t: ctx.run_context.context.role == "admin"
safe_tools_filter = lambda ctx, t: not t.name.startswith("danger_")

# Admin OR safe tools
combined = compose_filters_or(admin_filter, safe_tools_filter)
```

### Layered Filtering

```python
def layered_filter(context: ToolFilterContext, tool) -> bool:
    """Apply multiple filtering layers."""

    # Layer 1: Global blocklist
    global_blocked = ["system_shutdown", "drop_database"]
    if tool.name in global_blocked:
        return False

    # Layer 2: Environment-based
    if context.run_context.context.environment == "production":
        if tool.name.startswith("test_"):
            return False

    # Layer 3: User permissions
    user = context.run_context.context.user
    if tool.name.startswith("admin_"):
        return user.is_admin

    return True
```

## Filter with Caching

### Cached Filtering

```python
async def main():
    tool_filter = create_static_tool_filter(
        allowed_tool_names=["tool_a", "tool_b"]
    )

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="CachedFilteredClient",
        tool_filter=tool_filter,
        cache_tools_list=True  # Cache filtered results
    ) as mcp_server:
        # First call: fetches and filters tools
        tools1 = await mcp_server.list_tools(run_context=ctx, agent=agent)

        # Subsequent calls: returns cached filtered list
        tools2 = await mcp_server.list_tools(run_context=ctx, agent=agent)

        # Invalidate cache if needed
        mcp_server.invalidate_tools_cache()
```

### Cache Invalidation

```python
# Invalidate when tools change
if tools_updated:
    mcp_server.invalidate_tools_cache()

# Invalidate on permission change
if user_permissions_changed:
    mcp_server.invalidate_tools_cache()
```

## Complete Example

### Role-Based Access Control

```python
import asyncio
from dataclasses import dataclass
from agents import Agent, Runner, OpenAIChatCompletionsModel
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams, ToolFilterContext
from openai import AsyncOpenAI

@dataclass
class AppContext:
    user_id: str
    role: str  # "admin", "editor", "viewer"
    tenant_id: str

def rbac_filter(context: ToolFilterContext, tool) -> bool:
    """Role-based access control filter."""
    app_ctx: AppContext = context.run_context.context

    # Tool access rules
    ROLE_TOOLS = {
        "admin": ["*"],  # All tools
        "editor": ["create_", "read_", "update_", "list_"],
        "viewer": ["read_", "list_"]
    }

    allowed_prefixes = ROLE_TOOLS.get(app_ctx.role, [])

    if "*" in allowed_prefixes:
        return True

    return any(tool.name.startswith(prefix) for prefix in allowed_prefixes)

async def main():
    client = AsyncOpenAI(api_key="your-key")
    mcp_params = MCPServerStreamableHttpParams(url="http://localhost:8001/mcp/")

    # User context
    user_ctx = AppContext(
        user_id="user_123",
        role="editor",
        tenant_id="tenant_abc"
    )

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="RBACClient",
        tool_filter=rbac_filter,
        cache_tools_list=True
    ) as mcp_server:
        agent = Agent(
            name="RBACAgent",
            instructions="You have role-based access to tools.",
            mcp_servers=[mcp_server],
            model=OpenAIChatCompletionsModel(model="gpt-4o", openai_client=client)
        )

        # Run with user context
        result = await Runner.run(
            agent,
            "Create a new task",
            context=user_ctx
        )

        print(result.final_output)

asyncio.run(main())
```

## Best Practices

1. **Default Deny**: Start with blocking all, then explicitly allow
2. **Least Privilege**: Give minimum required access
3. **Log Filter Decisions**: Track what's filtered for debugging
4. **Test Filters**: Unit test filter logic separately
5. **Cache Appropriately**: Enable caching for static filters
6. **Document Rules**: Comment why tools are blocked/allowed
