# MCP Server Patterns

## Server Initialization

### Basic FastMCP Server
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    name="my-mcp-server",
    stateless_http=True,
    json_response=True  # Easier for HTTP clients
)

# Create streamable HTTP app
streamable_http_app = mcp.streamable_http_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:streamable_http_app", host="0.0.0.0", port=8001, reload=True)
```

### Server Configuration Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | str | Server identifier |
| `stateless_http` | bool | Enable stateless HTTP transport |
| `json_response` | bool | Use JSON instead of SSE |

## Defining Tools

### Basic Tool
```python
@mcp.tool(name="tool_name", description="What this tool does")
def my_tool(param: str) -> str:
    """Tool docstring becomes parameter description."""
    return f"Result: {param}"
```

### Tool with Type Hints
```python
from typing import Optional

@mcp.tool(
    name="create_task",
    description="Create a new task in the system"
)
def create_task(
    title: str,
    description: Optional[str] = None,
    priority: int = 1
) -> dict:
    """Create a task.

    Args:
        title: Task title (required)
        description: Optional task description
        priority: Priority level (1-5, default 1)
    """
    return {
        "id": "task_123",
        "title": title,
        "description": description,
        "priority": priority
    }
```

### Async Tool
```python
import asyncio

@mcp.tool(name="async_search", description="Search asynchronously")
async def async_search(query: str) -> str:
    """Perform async search operation."""
    await asyncio.sleep(0.1)  # Simulated async operation
    return f"Results for: {query}"
```

### Tool with Complex Types
```python
from pydantic import BaseModel, Field
from typing import List

class TaskInput(BaseModel):
    title: str = Field(description="Task title")
    tags: List[str] = Field(default=[], description="Task tags")

@mcp.tool(name="create_complex_task", description="Create task with complex input")
def create_complex_task(task: TaskInput) -> dict:
    return {"title": task.title, "tags": task.tags}
```

## Defining Resources

### Static Resource
```python
@mcp.resource(
    uri="app:///config",
    name="Application Config",
    description="Application configuration",
    mime_type="application/json"
)
def get_config() -> dict:
    return {"version": "1.0", "environment": "production"}
```

### Dynamic Resource with URI Template
```python
documents = {
    "readme": "# Welcome\nThis is the readme.",
    "guide": "# User Guide\nStep by step instructions."
}

@mcp.resource(
    uri="docs://{doc_id}",
    name="Document Reader",
    description="Read document by ID",
    mime_type="text/plain"
)
def get_document(doc_id: str) -> str:
    if doc_id not in documents:
        raise ValueError(f"Document '{doc_id}' not found")
    return documents[doc_id]
```

### Resource Listing
```python
@mcp.resource(
    uri="docs://list",
    mime_type="application/json"
)
def list_documents() -> list:
    return list(documents.keys())
```

## Defining Prompts

### Basic Prompt
```python
from mcp.server.fastmcp.prompts import base

@mcp.prompt(
    name="summarize",
    description="Summarize content"
)
def summarize_prompt(content: str) -> list[base.Message]:
    return [base.UserMessage(f"Please summarize: {content}")]
```

### Prompt with Pydantic Fields
```python
from pydantic import Field

@mcp.prompt(
    name="code_review",
    description="Generate code review instructions"
)
def code_review_instructions(
    focus: str = Field(description="Focus area for review"),
    language: str = Field(default="python", description="Programming language")
) -> str:
    return f"""You are a {language} code review specialist.
Focus on: {focus}

Review the code for:
1. Code quality
2. Security issues
3. Performance
4. Best practices for {focus}
"""
```

### Prompt with Multiple Messages
```python
from mcp.types import PromptMessage, TextContent

@mcp.prompt(
    name="conversation_starter",
    description="Start a conversation"
)
def conversation_prompt(topic: str) -> list[PromptMessage]:
    return [
        PromptMessage(
            role="system",
            content=TextContent(type="text", text=f"You are an expert on {topic}.")
        ),
        PromptMessage(
            role="user",
            content=TextContent(type="text", text=f"Tell me about {topic}.")
        )
    ]
```

## Complete Server Example

### Full-Featured MCP Server
```python
import logging
from mcp.server.fastmcp import FastMCP
from pydantic import Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize server
mcp = FastMCP(
    name="TaskManagementServer",
    stateless_http=True,
    json_response=True
)

# In-memory task store
tasks = {}
task_counter = 0

# Tools
@mcp.tool(name="create_task", description="Create a new task")
def create_task(title: str, description: str = "") -> dict:
    """Create a task.

    Args:
        title: Task title
        description: Task description
    """
    global task_counter
    task_counter += 1
    task_id = f"task_{task_counter}"
    tasks[task_id] = {
        "id": task_id,
        "title": title,
        "description": description,
        "completed": False
    }
    logger.info(f"Created task: {task_id}")
    return tasks[task_id]

@mcp.tool(name="list_tasks", description="List all tasks")
def list_tasks() -> list:
    """List all tasks."""
    return list(tasks.values())

@mcp.tool(name="complete_task", description="Mark task as complete")
def complete_task(task_id: str) -> dict:
    """Mark a task as complete.

    Args:
        task_id: ID of the task to complete
    """
    if task_id not in tasks:
        raise ValueError(f"Task {task_id} not found")
    tasks[task_id]["completed"] = True
    logger.info(f"Completed task: {task_id}")
    return tasks[task_id]

@mcp.tool(name="delete_task", description="Delete a task")
def delete_task(task_id: str) -> dict:
    """Delete a task.

    Args:
        task_id: ID of the task to delete
    """
    if task_id not in tasks:
        raise ValueError(f"Task {task_id} not found")
    deleted = tasks.pop(task_id)
    logger.info(f"Deleted task: {task_id}")
    return {"deleted": True, "task": deleted}

# Resources
@mcp.resource(uri="tasks://all", mime_type="application/json")
def all_tasks_resource() -> list:
    return list(tasks.values())

@mcp.resource(uri="tasks://{task_id}", mime_type="application/json")
def task_resource(task_id: str) -> dict:
    if task_id not in tasks:
        raise ValueError(f"Task {task_id} not found")
    return tasks[task_id]

# Prompts
@mcp.prompt(name="task_manager", description="Task management instructions")
def task_manager_prompt(focus: str = Field(description="Task focus area")) -> str:
    return f"""You are a task management assistant.
Focus area: {focus}

You can:
- Create new tasks
- List existing tasks
- Mark tasks as complete
- Delete tasks

Be helpful and efficient in managing the user's tasks."""

# Create HTTP app
streamable_http_app = mcp.streamable_http_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:streamable_http_app", host="0.0.0.0", port=8001, reload=True)
```

## Server with Database Integration

### SQLModel Integration
```python
from sqlmodel import SQLModel, Field, create_engine, Session, select

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str | None = None
    completed: bool = False
    user_id: str = Field(index=True)

engine = create_engine("postgresql://...")

@mcp.tool(name="db_create_task", description="Create task in database")
def db_create_task(title: str, user_id: str, description: str = "") -> dict:
    with Session(engine) as session:
        task = Task(title=title, description=description, user_id=user_id)
        session.add(task)
        session.commit()
        session.refresh(task)
        return task.model_dump()

@mcp.tool(name="db_list_tasks", description="List user's tasks from database")
def db_list_tasks(user_id: str) -> list:
    with Session(engine) as session:
        statement = select(Task).where(Task.user_id == user_id)
        tasks = session.exec(statement).all()
        return [t.model_dump() for t in tasks]
```

## Error Handling

### Tool Error Handling
```python
@mcp.tool(name="safe_operation", description="Operation with error handling")
def safe_operation(data: str) -> dict:
    try:
        # Perform operation
        result = process_data(data)
        return {"success": True, "result": result}
    except ValueError as e:
        return {"success": False, "error": str(e), "type": "validation_error"}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {"success": False, "error": "Internal error", "type": "internal_error"}
```

## Running the Server

### Development
```bash
# Using uvicorn directly
uvicorn server:streamable_http_app --host 0.0.0.0 --port 8001 --reload

# Using Python
python server.py
```

### Production
```bash
# With Gunicorn
gunicorn server:streamable_http_app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001

# With Docker
docker run -p 8001:8001 my-mcp-server
```

### Dockerfile Example
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

EXPOSE 8001

CMD ["uvicorn", "server:streamable_http_app", "--host", "0.0.0.0", "--port", "8001"]
```
