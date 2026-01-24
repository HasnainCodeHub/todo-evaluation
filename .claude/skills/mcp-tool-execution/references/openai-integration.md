# MCP Integration with OpenAI Agent SDK

## Overview

The OpenAI Agent SDK provides seamless integration with MCP servers using the agents library, allowing AI agents to automatically discover and use tools exposed via MCP protocols. This integration maintains the tool-mediated AI approach by ensuring all agent interactions occur through registered tools.

## Actual Integration Pattern (Based on Real Implementation)

### Single MCP Server Integration
```python
import asyncio
from openai import AsyncOpenAI
from agents import Agent, OpenAIChatCompletionsModel, Runner
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def connect_single_mcp_server(server_url: str):
    # Initialize OpenAI client (can be Google Gemini via OpenAI-compatible API)
    client = AsyncOpenAI(
        api_key="your-api-key",
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

    # Create MCP server connection with tool caching
    mcp_params = MCPServerStreamableHttpParams(url=server_url)

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="MyMCPServerClient",
        cache_tools_list=True  # Enable tool caching for performance
    ) as mcp_server_client:

        # Create agent with MCP server connection
        assistant = Agent(
            name="MyMCPConnectedAssistant",
            mcp_servers=[mcp_server_client],  # Pass MCP server client directly
            model=OpenAIChatCompletionsModel(model="gpt-4o", openai_client=client),
        )

        # Optional: Explicitly list tools to verify connection
        tools = await mcp_server_client.list_tools()
        print(f"Available tools: {tools}")

        # Run agent interaction
        result = await Runner.run(assistant, "Use available tools to perform task")

        return result.final_output
```

### Multiple MCP Servers Integration
```python
import asyncio
from contextlib import AsyncExitStack
from agents import Agent, OpenAIChatCompletionsModel, Runner
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def connect_multiple_mcp_servers(server_urls: list):
    """
    Connect to multiple MCP servers and aggregate tools using AsyncExitStack
    """
    mcp_servers = []

    async with AsyncExitStack() as stack:
        for url in server_urls:
            mcp_params = MCPServerStreamableHttpParams(url=url)
            mcp_server_client = await stack.enter_async_context(
                MCPServerStreamableHttp(
                    params=mcp_params,
                    name=f"MCPClient_{url}",
                    cache_tools_list=True
                )
            )
            mcp_servers.append(mcp_server_client)

    # Create agent with multiple MCP servers
    client = AsyncOpenAI(api_key="your-api-key")

    assistant = Agent(
        name="MultiMCPAssistant",
        mcp_servers=mcp_servers,  # Pass all server clients
        model=OpenAIChatCompletionsModel(model="gpt-4o", openai_client=client),
    )

    return assistant

# Usage
async def run_agent_with_multiple_servers():
    server_urls = [
        "http://localhost:8001/mcp/",  # Mood server
        "http://localhost:8002/mcp/",  # Weather server
    ]

    assistant = await connect_multiple_mcp_servers(server_urls)

    # Agent will have access to tools from all connected servers
    result = await Runner.run(assistant, "Get mood and weather information")

    return result.final_output
```

## Tool Discovery and Aggregation

### Logical Tool Registry
When multiple MCP servers are connected, the agents library creates a logical registry that aggregates tools from all connected servers:

```python
# The agents library automatically:
# 1. Discovers tools from all connected MCP servers via list_tools() calls
# 2. Creates a unified tool registry accessible to the LLM
# 3. Handles tool routing to appropriate servers
# 4. May cache tool lists for performance (when cache_tools_list=True)
```

### Name Conflict Prevention
```python
# Recommended naming convention to prevent conflicts:
TOOL_NAMING_GUIDELINES = {
    "format": "namespace_service_action",
    "examples": [
        "mood_get_status",
        "weather_get_current",
        "finance_get_stock_price",
        "news_search_articles"
    ]
}

# Server 1 (Mood Server)
# - Tool names: mood_from_shared_server

# Server 2 (Weather Server)
# - Tool names: weather_get_current, weather_get_forecast
```

## MCP Server Implementation for OpenAI Integration

### Complete MCP Server Example (Actual Pattern)
```python
from mcp.server.fastmcp import FastMCP
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create FastMCP application
mcp_app = FastMCP(
    name="MyMCPToolServer",
    description="A simple MCP server for OpenAI Agents SDK integration.",
    stateless_http=True,
    json_response=True,  # Easier for HTTP clients without full SSE parsing
)

@mcp_app.tool(
    name="greeting_from_server",
    description="Returns a personalized greeting from the MCP server."
)
def greeting_tool(name: str = "World") -> str:
    """A simple greeting tool."""
    logger.info(f"Greeting tool called with name: {name}")
    return f"Hello, {name}! I am happy to serve you."

# Create streamable HTTP app for the server
def create_mcp_server():
    return mcp_app.streamable_http_app()

# Run the server
if __name__ == "__main__":
    import uvicorn
    app = create_mcp_server()
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
```

## Security and Access Control

### Authentication Between MCP and Agent SDK
```python
# MCP Server with authentication (if needed)
mcp_app = FastMCP(
    name="SecureMCPServer",
    description="A secure MCP server with authentication.",
    stateless_http=True,
    json_response=True,
)

# Note: Authentication would typically be handled at the transport layer
# or through MCP protocol extensions, not necessarily in the tool definitions
```

## Error Handling in MCP-Agent Integration

### MCP Server Error Responses (Actual Pattern)
```python
# In the actual implementation, errors are typically raised normally
# and handled by the MCP framework

@mcp_app.tool(name="reliable_tool", description="A tool with proper error handling")
def tool_with_error_handling(name: str = "World") -> str:
    """
    Tool with basic validation
    """
    if not name.strip():
        raise ValueError("Name cannot be empty")

    # Perform operation
    return f"Processed: {name}"

# The MCP framework handles converting exceptions to proper MCP error responses
```

## Tool Caching Implementation

### Caching Tool Lists for Performance
```python
# When connecting to MCP servers, you can enable tool caching:
async with MCPServerStreamableHttp(
    params=mcp_params,
    name="CachedMCPServer",
    cache_tools_list=True  # Cache the tool list after first discovery
) as mcp_server_client:
    # The tool list will be cached after the first call to list_tools()
    # Subsequent calls will use the cached list for performance
    tools = await mcp_server_client.list_tools()
    # Additional calls will use cached version
    tools = await mcp_server_client.list_tools()  # This uses cache
```

## Agent Runner Pattern

### Using the Runner for Agent Execution
```python
from agents import Runner

async def run_agent_interaction(agent, user_input: str):
    """
    Run an agent interaction using the Runner pattern
    """
    result = await Runner.run(agent, user_input)

    # The result contains the final output
    return result.final_output

# Complete example
async def main():
    # Set up MCP server connection
    mcp_params = MCPServerStreamableHttpParams(url="http://localhost:8001/mcp/")

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="MyMCPServer",
        cache_tools_list=True
    ) as mcp_server_client:

        # Create agent
        client = AsyncOpenAI(api_key="your-api-key")
        assistant = Agent(
            name="MyAssistant",
            mcp_servers=[mcp_server_client],
            model=OpenAIChatCompletionsModel(model="gpt-4o", openai_client=client),
        )

        # Run interaction
        response = await run_agent_interaction(assistant, "What is the mood?")
        print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Monitoring Tool Discovery

### Verifying Tool Connection
```python
# You can explicitly check what tools are available:
async def verify_tools(mcp_server_client):
    """
    Verify that tools are properly discovered from the MCP server
    """
    tools = await mcp_server_client.list_tools()
    print(f"Discovered {len(tools)} tools:")
    for tool in tools:
        print(f"  - {tool.name}: {tool.description}")

    return tools
```

This integration ensures that OpenAI agents can seamlessly use MCP tools while maintaining the security and control of tool-mediated AI interactions, using the actual agents library implementation patterns.