# Agent Patterns

## Agent Creation

### Basic Agent
```python
from agents import Agent, Runner

agent = Agent(
    name="BasicAgent",
    instructions="You are a helpful assistant."
)

result = await Runner.run(agent, "Hello!")
print(result.final_output)
```

### Agent with Custom Model
```python
from agents import Agent, OpenAIChatCompletionsModel
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key="your-key")

agent = Agent(
    name="CustomModelAgent",
    instructions="You are a helpful assistant.",
    model=OpenAIChatCompletionsModel(
        model="gpt-4o",
        openai_client=client
    )
)
```

### Agent with Gemini (OpenAI-Compatible)
```python
from agents import Agent, OpenAIChatCompletionsModel
from openai import AsyncOpenAI

# Use Gemini via OpenAI-compatible endpoint
client = AsyncOpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

agent = Agent(
    name="GeminiAgent",
    instructions="You are a helpful assistant.",
    model=OpenAIChatCompletionsModel(
        model="gemini-2.0-flash",
        openai_client=client
    )
)
```

## Agent with Local Tools

### Function Tool Decorator
```python
from agents import Agent, function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get weather for a city.

    Args:
        city: The city name to get weather for.
    """
    return f"Weather in {city}: sunny, 72°F"

@function_tool
async def search_database(query: str) -> str:
    """Search the database.

    Args:
        query: Search query string.
    """
    # Async tool example
    return f"Results for: {query}"

agent = Agent(
    name="ToolAgent",
    instructions="You can check weather and search databases.",
    tools=[get_weather, search_database]
)
```

### Custom Function Tool
```python
from agents import FunctionTool

def custom_handler(**kwargs):
    return f"Processed: {kwargs}"

custom_tool = FunctionTool(
    name="custom_processor",
    description="Process custom data",
    params_json_schema={
        "type": "object",
        "properties": {
            "data": {"type": "string", "description": "Data to process"}
        },
        "required": ["data"]
    },
    on_invoke_tool=custom_handler
)

agent = Agent(
    name="CustomToolAgent",
    tools=[custom_tool]
)
```

## Agent with MCP Servers

### Single MCP Server
```python
from agents import Agent
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def create_agent_with_mcp():
    mcp_params = MCPServerStreamableHttpParams(url="http://localhost:8001/mcp/")

    async with MCPServerStreamableHttp(
        params=mcp_params,
        name="MCPClient"
    ) as mcp_server:
        agent = Agent(
            name="MCPAgent",
            instructions="You have access to MCP tools.",
            mcp_servers=[mcp_server],
            model=model
        )
        return agent
```

### Multiple MCP Servers
```python
from contextlib import AsyncExitStack
from agents import Agent
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def create_multi_mcp_agent(server_urls: list):
    mcp_servers = []

    async with AsyncExitStack() as stack:
        for url in server_urls:
            params = MCPServerStreamableHttpParams(url=url)
            client = await stack.enter_async_context(
                MCPServerStreamableHttp(
                    params=params,
                    name=f"MCPClient_{url}",
                    cache_tools_list=True
                )
            )
            mcp_servers.append(client)

        agent = Agent(
            name="MultiMCPAgent",
            instructions="You have access to tools from multiple servers.",
            mcp_servers=mcp_servers,
            model=model
        )

        # Run agent within the context
        result = await Runner.run(agent, "Use available tools")
        return result
```

## Agent with Mixed Tools

### Local + MCP Tools
```python
from agents import Agent, function_tool
from agents.mcp import MCPServerStreamableHttp

@function_tool
def local_calculator(a: float, b: float) -> float:
    """Add two numbers."""
    return a + b

async def create_mixed_agent():
    async with MCPServerStreamableHttp(params=mcp_params) as mcp_server:
        agent = Agent(
            name="MixedAgent",
            instructions="You have local and remote tools.",
            tools=[local_calculator],  # Local tools
            mcp_servers=[mcp_server],  # Remote MCP tools
            model=model
        )
        return agent
```

## Dynamic Instructions

### Function-Based Instructions
```python
from agents import Agent, RunContextWrapper

def dynamic_instructions(context: RunContextWrapper, agent: Agent) -> str:
    user_name = context.context.user_name
    return f"You are helping {user_name}. Be friendly and helpful."

agent = Agent(
    name="DynamicAgent",
    instructions=dynamic_instructions
)
```

### Async Dynamic Instructions
```python
async def async_instructions(context: RunContextWrapper, agent: Agent) -> str:
    # Fetch instructions from database
    instructions = await fetch_instructions(context.context.user_id)
    return instructions

agent = Agent(
    name="AsyncDynamicAgent",
    instructions=async_instructions
)
```

## Structured Output

### Pydantic Output Type
```python
from pydantic import BaseModel
from agents import Agent

class TaskResult(BaseModel):
    task_name: str
    status: str
    priority: int
    notes: str | None = None

agent = Agent(
    name="StructuredAgent",
    instructions="Extract task information.",
    output_type=TaskResult
)

result = await Runner.run(agent, "Create a high priority task to review code")
task: TaskResult = result.final_output  # Typed output
```

## Agent Lifecycle

### Proper Resource Management
```python
import asyncio
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async def main():
    # Always use async context manager for MCP servers
    async with MCPServerStreamableHttp(params=mcp_params) as mcp:
        agent = Agent(
            name="LifecycleAgent",
            mcp_servers=[mcp]
        )

        # Run multiple queries within context
        result1 = await Runner.run(agent, "Query 1")
        result2 = await Runner.run(agent, "Query 2")

    # Resources automatically cleaned up here

if __name__ == "__main__":
    asyncio.run(main())
```

## Runner Configuration

### Run Config Options
```python
from agents import Runner, RunConfig

config = RunConfig(
    max_turns=10,  # Limit agent turns
    tracing_disabled=False,  # Enable tracing
    trace_include_sensitive_data=False  # Hide sensitive data
)

result = await Runner.run(agent, "Query", run_config=config)
```

### Streaming Response
```python
result = Runner.run_streamed(agent, "Query")

async for event in result.stream_events():
    if event.type == "raw_response_event":
        print(event.data.delta, end="", flush=True)
```

## Conversation Management

### Manual History
```python
# First turn
result1 = await Runner.run(agent, "Hello")

# Continue conversation
history = result1.to_input_list()
result2 = await Runner.run(agent, history + ["Follow up question"])
```

### Session-Based
```python
from agents.sessions import SQLiteSession

session = SQLiteSession(database_path="chat.db")

result = await Runner.run(
    agent,
    "Hello",
    session=session
)
# History automatically persisted
```
