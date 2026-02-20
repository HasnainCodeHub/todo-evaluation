# MCP Transport Options

## Overview

The OpenAI Agents SDK supports multiple MCP transport mechanisms for connecting to MCP servers.

| Transport | Class | Best For |
|-----------|-------|----------|
| HTTP Streamable | `MCPServerStreamableHttp` | Production, remote servers |
| SSE | `MCPServerSse` | Legacy systems (deprecated) |
| Stdio | `MCPServerStdio` | Local development, CLI tools |
| Hosted | `HostedMCPTool` | OpenAI-managed tools |

## HTTP Streamable Transport

### Basic Connection
```python
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

MCP_SERVER_URL = "http://localhost:8001/mcp/"

mcp_params = MCPServerStreamableHttpParams(url=MCP_SERVER_URL)

async with MCPServerStreamableHttp(
    params=mcp_params,
    name="MyHTTPClient"
) as mcp_server:
    tools = await mcp_server.list_tools()
    print(f"Available tools: {[t.name for t in tools]}")
```

### With Configuration Options
```python
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

mcp_params = MCPServerStreamableHttpParams(
    url="http://localhost:8001/mcp/",
    headers={"Authorization": "Bearer token123"},  # Custom headers
    timeout=30,  # HTTP timeout in seconds
)

async with MCPServerStreamableHttp(
    params=mcp_params,
    name="ConfiguredClient",
    cache_tools_list=True,  # Cache tool definitions
    tool_filter=my_filter,  # Apply tool filter
) as mcp_server:
    # Use server
    pass
```

### MCPServerStreamableHttpParams Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | str | MCP server URL (required) |
| `headers` | dict | Custom HTTP headers |
| `timeout` | float | Request timeout (seconds) |

### MCPServerStreamableHttp Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | MCPServerStreamableHttpParams | Connection parameters |
| `name` | str | Client identifier |
| `cache_tools_list` | bool | Cache tool definitions |
| `tool_filter` | callable | Tool filtering function |

## SSE Transport (Deprecated)

**Note**: SSE transport is deprecated. Use HTTP Streamable for new projects.

```python
from agents.mcp import MCPServerSse, MCPServerSseParams

mcp_params = MCPServerSseParams(
    url="http://localhost:8001/sse",
    headers={"Authorization": "Bearer token"},
    timeout=5,  # HTTP timeout
    sse_read_timeout=300  # SSE connection timeout (5 min)
)

async with MCPServerSse(
    params=mcp_params,
    name="SSEClient"
) as mcp_server:
    # Use server
    pass
```

### MCPServerSseParams Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | str | required | Server endpoint URL |
| `headers` | dict | None | HTTP headers |
| `timeout` | float | 5 | HTTP request timeout |
| `sse_read_timeout` | float | 300 | SSE connection timeout |

## Stdio Transport

For local MCP servers running as subprocesses.

### Basic Stdio Connection
```python
from agents.mcp import MCPServerStdio, MCPServerStdioParams

mcp_params = MCPServerStdioParams(
    command="python",
    args=["my_mcp_server.py"]
)

async with MCPServerStdio(
    params=mcp_params,
    name="StdioClient"
) as mcp_server:
    tools = await mcp_server.list_tools()
```

### With Environment Variables
```python
from agents.mcp import MCPServerStdio, MCPServerStdioParams

mcp_params = MCPServerStdioParams(
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "."],
    env={"NODE_ENV": "production"},  # Environment variables
    cwd="/path/to/working/dir",  # Working directory
    encoding="utf-8"
)

async with MCPServerStdio(params=mcp_params, name="FSClient") as mcp:
    pass
```

### MCPServerStdioParams Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `command` | str | required | Executable to run |
| `args` | list | [] | Command arguments |
| `env` | dict | None | Environment variables |
| `cwd` | str | None | Working directory |
| `encoding` | str | "utf-8" | Text encoding |
| `encoding_error_handler` | str | "strict" | Error handling |

## Hosted MCP Tools

For OpenAI-hosted MCP tools.

```python
from agents import Agent
from agents.tools import HostedMCPTool

# Use hosted MCP tool
hosted_tool = HostedMCPTool(
    server_url="https://mcp.openai.com/my-connector",
    require_approval=True
)

agent = Agent(
    name="HostedAgent",
    instructions="Use hosted tools.",
    tools=[hosted_tool]
)
```

### With Connector
```python
from agents.tools import HostedMCPTool

# Using OpenAI connector
connector_tool = HostedMCPTool(
    connector_id="my-connector-id",
    access_token="connector-access-token"
)
```

## Multiple Transports

### Combining Different Transports
```python
from contextlib import AsyncExitStack
from agents import Agent
from agents.mcp import (
    MCPServerStreamableHttp,
    MCPServerStreamableHttpParams,
    MCPServerStdio,
    MCPServerStdioParams
)

async def multi_transport_agent():
    async with AsyncExitStack() as stack:
        # HTTP server (remote)
        http_server = await stack.enter_async_context(
            MCPServerStreamableHttp(
                params=MCPServerStreamableHttpParams(url="http://api.example.com/mcp/"),
                name="RemoteHTTP"
            )
        )

        # Stdio server (local)
        stdio_server = await stack.enter_async_context(
            MCPServerStdio(
                params=MCPServerStdioParams(
                    command="python",
                    args=["local_server.py"]
                ),
                name="LocalStdio"
            )
        )

        # Agent with both transports
        agent = Agent(
            name="MultiTransportAgent",
            instructions="You have access to both remote and local tools.",
            mcp_servers=[http_server, stdio_server]
        )

        return agent
```

## Connection Management

### Retry Logic
```python
import asyncio
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def connect_with_retry(url: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            params = MCPServerStreamableHttpParams(url=url)
            server = MCPServerStreamableHttp(params=params, name="RetryClient")
            await server.connect()
            return server
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt  # Exponential backoff
            print(f"Connection failed, retrying in {wait_time}s: {e}")
            await asyncio.sleep(wait_time)
```

### Health Check
```python
async def check_mcp_server_health(url: str) -> bool:
    try:
        params = MCPServerStreamableHttpParams(url=url)
        async with MCPServerStreamableHttp(params=params, name="HealthCheck") as server:
            tools = await server.list_tools()
            return len(tools) >= 0
    except Exception:
        return False
```

### Graceful Shutdown
```python
import signal
import asyncio

async def main():
    shutdown_event = asyncio.Event()

    def signal_handler():
        shutdown_event.set()

    loop = asyncio.get_event_loop()
    loop.add_signal_handler(signal.SIGINT, signal_handler)
    loop.add_signal_handler(signal.SIGTERM, signal_handler)

    async with MCPServerStreamableHttp(params=params) as server:
        agent = Agent(name="Agent", mcp_servers=[server])

        while not shutdown_event.is_set():
            # Process requests
            await asyncio.sleep(0.1)

    print("Gracefully shutdown")
```

## Best Practices

1. **Use HTTP Streamable** for production deployments
2. **Use Stdio** for local development and testing
3. **Avoid SSE** for new projects (deprecated)
4. **Enable caching** when tool definitions are stable
5. **Implement retry logic** for network failures
6. **Use AsyncExitStack** for multiple connections
7. **Add health checks** for critical services
8. **Handle timeouts** appropriately per use case
