---
id: "007"
title: "Chat-Orchestrator-Skills-Added"
stage: "general"
date_iso: "2026-01-24"
surface: "agent"
model: "claude-sonnet-4-5-20250929"
feature: "none"
branch: "001-cli-task-crud"
user: "user"
command: "update-agent-config"
labels: ["agent", "configuration", "skills"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - ".claude/agents/chat-orchestrator.md"
tests: []
---

# Prompt History Record

## Original Prompt
```
add here :
---
name: chat-orchestrator
description: "Use this agent when the user initiates a natural language conversation that requires interpreting intent, deciding on tool usage, chaining multiple MCP tools together, or when friendly confirmations and error handling are needed for task execution.\\n\\n<example>\\nContext: User wants to perform a multi-step task that requires tool chaining.\\nuser: \"Can you check my todo list and then create a new task for the items that are overdue?\"\\nassistant: \"I'll use the Task tool to launch the chat-orchestrator agent to interpret your request and chain the necessary tools together.\"\\n<commentary>\\nSince this requires natural language interpretation, tool chaining (reading todos, filtering overdue, creating tasks), and friendly confirmation, use the chat-orchestrator agent.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: User makes a simple request that needs MCP tool execution with confirmation.\\nuser: \"Add 'Buy groceries' to my todo list\"\\nassistant: \"I'll use the Task tool to launch the chat-orchestrator agent to handle this request and provide confirmation.\"\\n<commentary>\\nThis natural language request needs interpretation, MCP tool execution, and a friendly confirmation response - perfect for chat-orchestrator.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: User request encounters an error that needs graceful handling.\\nuser: \"Delete all my completed tasks from last month\"\\nassistant: \"I'll use the Task tool to launch the chat-orchestrator agent to process this request and handle any potential errors gracefully.\"\\n<commentary>\\nThis task may involve multiple operations and potential errors (e.g., no completed tasks found, permission issues). The chat-orchestrator will handle task-level errors with user-friendly messaging.\\n</commentary>\\n</example>"
model: inherit
color: blue
---
also like this one:
model: inherit
color: yellow
skills:
  - monorepo-architecture
  - spec-referencing
  - claude-context-design
---
```

## Response Summary
Updated the chat-orchestrator agent configuration file (.claude/agents/chat-orchestrator.md) to include a skills section in the YAML frontmatter. Added the following skills:
- agent-prompt-behavior
- conversation-state-management
- mcp-tool-execution
- task-decomposition
- error-handling-confirmation

The configuration now follows the same format as other agent configurations with explicit skills listed in the YAML frontmatter for better clarity and system understanding.

## Outcome
The chat-orchestrator agent configuration has been successfully updated with a skills section in the YAML frontmatter, making the agent's capabilities more clearly defined and accessible to the system.