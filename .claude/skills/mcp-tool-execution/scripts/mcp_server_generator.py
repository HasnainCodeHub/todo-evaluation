#!/usr/bin/env python3
"""
MCP Server Template Generator

This script generates a complete MCP server template with best practices
for tool registration, validation, and deterministic execution.
"""

import os
import sys
from pathlib import Path
import argparse
from typing import Dict, Any, List


def create_mcp_server_template(
    project_name: str,
    tools: List[Dict[str, Any]],
    output_dir: str = None
) -> str:
    """Generate a complete MCP server template."""

    if output_dir is None:
        output_dir = project_name

    # Create project directory
    os.makedirs(output_dir, exist_ok=True)

    # Create server.py
    server_content = f'''from mcp import FastMCP
from typing import Dict, Any, Optional
import jsonschema
import logging
import asyncio
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JSON Schema validator
def validate_params(params: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
    """Validate parameters against JSON schema."""
    import jsonschema
    try:
        jsonschema.validate(params, schema)
        return params
    except jsonschema.ValidationError as e:
        raise ValueError(f"Parameter validation failed: {{str(e)}}")

def create_mcp_server():
    """Create MCP server with registered tools."""
    mcp = FastMCP(
        name="{project_name}-mcp-server",
        description="MCP server for {project_name} integration",
        stateless_http=True,
        json_response=True  # Easier for HTTP clients without full SSE parsing
    )

{generate_tool_registrations(tools)}

    return mcp.streamable_http_app()


def main():
    import uvicorn
    app = create_mcp_server()
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
'''

    # Write server file
    server_path = os.path.join(output_dir, "server.py")
    with open(server_path, 'w') as f:
        f.write(server_content)

    # Create pyproject.toml
    pyproject_content = '''[tool.poetry]
name = "mcp-server-template"
version = "0.1.0"
description = "Template MCP Server"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"
mcp = "^1.11.0"
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
jsonschema = "^4.19.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
'''

    pyproject_path = os.path.join(output_dir, "pyproject.toml")
    with open(pyproject_path, 'w') as f:
        f.write(pyproject_content)

    # Create README
    readme_content = f'''# {project_name} MCP Server

This is an MCP (Model Context Protocol) server with the following tools:

{generate_tool_list(tools)}

## Setup

```bash
pip install poetry
poetry install
```

## Run

```bash
poetry run python server.py
```

## Usage

Connect to this server from an OpenAI agent or other MCP client to access the tools.
'''

    readme_path = os.path.join(output_dir, "README.md")
    with open(readme_path, 'w') as f:
        f.write(readme_content)

    return f"MCP server template created in {output_dir}/"


def generate_tool_registrations(tools: List[Dict[str, Any]]) -> str:
    """Generate tool registration code."""
    registrations = []

    for tool in tools:
        name = tool['name']
        description = tool['description']
        schema = tool['schema']

        registration = f'''    @mcp.tool(
        name="{name}",
        description="{description}"
    )
    async def {name.replace("-", "_")}_tool(**kwargs):
        """{description}"""
        # Validate parameters
        validated_params = validate_params(kwargs, {repr(schema)})

        # Execute tool logic here
        logger.info("Executing tool: {name} with params: {{}}".format(validated_params))

        # TODO: Implement tool logic
        result = {{"message": "Tool {name} executed successfully", "params": validated_params}}

        return result
'''
        registrations.append(registration)

    return '\n'.join(registrations)


def generate_tool_list(tools: List[Dict[str, Any]]) -> str:
    """Generate a list of tools for README."""
    tool_list = []
    for tool in tools:
        tool_list.append(f"- {tool['name']}: {tool['description']}")
    return "\\n".join([f"  - {item}" for item in tool_list])


def main():
    parser = argparse.ArgumentParser(description='Generate MCP Server Template')
    parser.add_argument('--name', required=True, help='Project name')
    parser.add_argument('--output-dir', help='Output directory (defaults to project name)')

    args = parser.parse_args()

    # Define sample tools
    sample_tools = [
        {
            "name": "hello_world",
            "description": "Simple greeting tool",
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name to greet"}
                },
                "required": ["name"]
            }
        },
        {
            "name": "calculate_sum",
            "description": "Calculate sum of two numbers",
            "schema": {
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"}
                },
                "required": ["a", "b"]
            }
        }
    ]

    result = create_mcp_server_template(args.name, sample_tools, args.output_dir)
    print(result)


if __name__ == "__main__":
    main()