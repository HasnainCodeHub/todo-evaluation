# Multi-Agent Orchestration

## Orchestration Approaches

### LLM-Driven Orchestration
Agent autonomously decides how to complete tasks using available tools and handoffs.

### Code-Based Orchestration
Deterministic control flow with structured outputs and explicit chaining.

## Handoff Patterns

### Basic Handoff
```python
from agents import Agent, Runner

# Specialist agent
math_agent = Agent(
    name="MathExpert",
    instructions="You are a math expert. Solve mathematical problems."
)

# General agent with handoff
general_agent = Agent(
    name="GeneralAssistant",
    instructions="Help users. For math problems, transfer to MathExpert.",
    handoffs=[math_agent]  # Direct handoff
)

# When user asks math question, general_agent can transfer to math_agent
result = await Runner.run(general_agent, "What is 15% of 240?")
```

### Custom Handoff Configuration
```python
from agents import Agent, handoff

specialist = Agent(
    name="CustomerSupport",
    instructions="Handle customer support inquiries."
)

# Customize handoff behavior
custom_handoff = handoff(
    agent=specialist,
    tool_name_override="escalate_to_support",  # Custom tool name
    tool_description_override="Transfer to customer support for complex issues",
    on_handoff=lambda ctx: print(f"Handoff triggered"),
)

main_agent = Agent(
    name="MainBot",
    instructions="Greet users. Escalate support issues.",
    handoffs=[custom_handoff]
)
```

### Handoff with Input Data
```python
from pydantic import BaseModel
from agents import Agent, handoff

class EscalationData(BaseModel):
    reason: str
    priority: str
    context: str

def on_escalation(ctx, data: EscalationData):
    print(f"Escalation: {data.reason} ({data.priority})")

specialist = Agent(name="Specialist", instructions="Handle escalations.")

escalation_handoff = handoff(
    agent=specialist,
    input_type=EscalationData,  # Require structured input
    on_handoff=on_escalation
)

agent = Agent(
    name="Frontline",
    instructions="Help users. Escalate complex issues with reason and priority.",
    handoffs=[escalation_handoff]
)
```

### Handoff with Input Filter
```python
from agents import handoff, handoff_filters

# Filter what history passes to next agent
filtered_handoff = handoff(
    agent=specialist,
    input_filter=handoff_filters.remove_all_tools  # Remove tool calls
)

# Custom filter
def custom_filter(input_data):
    # Keep only last 5 messages
    input_data.history = input_data.history[-5:]
    return input_data

custom_filtered_handoff = handoff(
    agent=specialist,
    input_filter=custom_filter
)
```

## Agents as Tools Pattern

### Converting Agent to Tool
```python
from agents import Agent

# Specialist agent
researcher = Agent(
    name="Researcher",
    instructions="Research topics and provide detailed information."
)

# Convert to tool
researcher_tool = researcher.as_tool(
    tool_name="research_topic",
    tool_description="Research a topic in depth"
)

# Manager agent uses researcher as tool
manager = Agent(
    name="Manager",
    instructions="Orchestrate research tasks.",
    tools=[researcher_tool]  # Agent as tool
)
```

### Agent Tool with Input Schema
```python
from pydantic import BaseModel, Field
from agents import Agent

class ResearchInput(BaseModel):
    topic: str = Field(description="Topic to research")
    depth: str = Field(default="medium", description="Research depth: shallow, medium, deep")

researcher = Agent(
    name="Researcher",
    instructions="Research topics based on specified depth."
)

researcher_tool = researcher.as_tool(
    tool_name="conduct_research",
    tool_description="Conduct research on a topic",
    input_type=ResearchInput  # Structured input
)
```

## Multi-Agent Workflows

### Sequential Chain
```python
from agents import Agent, Runner

analyst = Agent(name="Analyst", instructions="Analyze data and identify patterns.")
writer = Agent(name="Writer", instructions="Write clear reports based on analysis.")
reviewer = Agent(name="Reviewer", instructions="Review and improve reports.")

async def sequential_workflow(data: str):
    # Step 1: Analysis
    analysis = await Runner.run(analyst, f"Analyze: {data}")

    # Step 2: Write report
    report = await Runner.run(writer, f"Write report on: {analysis.final_output}")

    # Step 3: Review
    final = await Runner.run(reviewer, f"Review: {report.final_output}")

    return final.final_output
```

### Parallel Execution
```python
import asyncio
from agents import Agent, Runner

researcher1 = Agent(name="Tech Researcher", instructions="Research technology topics.")
researcher2 = Agent(name="Market Researcher", instructions="Research market trends.")
synthesizer = Agent(name="Synthesizer", instructions="Combine research findings.")

async def parallel_workflow(topic: str):
    # Run research in parallel
    tech_task = Runner.run(researcher1, f"Research tech aspects of {topic}")
    market_task = Runner.run(researcher2, f"Research market for {topic}")

    tech_result, market_result = await asyncio.gather(tech_task, market_task)

    # Synthesize results
    combined = f"""
    Tech Research: {tech_result.final_output}
    Market Research: {market_result.final_output}
    """

    final = await Runner.run(synthesizer, f"Synthesize: {combined}")
    return final.final_output
```

### Conditional Routing
```python
from agents import Agent, Runner
from pydantic import BaseModel

class QueryClassification(BaseModel):
    category: str  # "technical", "billing", "general"
    confidence: float

classifier = Agent(
    name="Classifier",
    instructions="Classify user queries into categories.",
    output_type=QueryClassification
)

tech_agent = Agent(name="TechSupport", instructions="Handle technical issues.")
billing_agent = Agent(name="Billing", instructions="Handle billing questions.")
general_agent = Agent(name="General", instructions="Handle general inquiries.")

async def routed_workflow(query: str):
    # Classify query
    classification = await Runner.run(classifier, query)
    result: QueryClassification = classification.final_output

    # Route to appropriate agent
    if result.category == "technical":
        response = await Runner.run(tech_agent, query)
    elif result.category == "billing":
        response = await Runner.run(billing_agent, query)
    else:
        response = await Runner.run(general_agent, query)

    return response.final_output
```

### Feedback Loop
```python
from agents import Agent, Runner
from pydantic import BaseModel

class QualityScore(BaseModel):
    score: int  # 1-10
    feedback: str
    approved: bool

writer = Agent(name="Writer", instructions="Write content based on requirements.")
reviewer = Agent(
    name="Reviewer",
    instructions="Review content quality. Score 1-10. Approve if score >= 7.",
    output_type=QualityScore
)

async def feedback_loop(requirements: str, max_iterations: int = 3):
    content = None

    for i in range(max_iterations):
        # Generate/improve content
        prompt = requirements if content is None else f"""
        Requirements: {requirements}
        Previous attempt: {content}
        Feedback: {review.feedback if 'review' in dir() else 'First attempt'}
        """

        result = await Runner.run(writer, prompt)
        content = result.final_output

        # Review content
        review_result = await Runner.run(reviewer, content)
        review: QualityScore = review_result.final_output

        if review.approved:
            return content

    return content  # Return best effort after max iterations
```

## MCP Multi-Server Pattern

### Multiple MCP Servers with Multiple Agents
```python
from contextlib import AsyncExitStack
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp, MCPServerStreamableHttpParams

async def multi_server_multi_agent():
    async with AsyncExitStack() as stack:
        # Connect to task server
        task_server = await stack.enter_async_context(
            MCPServerStreamableHttp(
                params=MCPServerStreamableHttpParams(url="http://localhost:8001/mcp/"),
                name="TaskServer"
            )
        )

        # Connect to data server
        data_server = await stack.enter_async_context(
            MCPServerStreamableHttp(
                params=MCPServerStreamableHttpParams(url="http://localhost:8002/mcp/"),
                name="DataServer"
            )
        )

        # Task manager agent
        task_agent = Agent(
            name="TaskManager",
            instructions="Manage tasks using task tools.",
            mcp_servers=[task_server]
        )

        # Data analyst agent
        data_agent = Agent(
            name="DataAnalyst",
            instructions="Analyze data using data tools.",
            mcp_servers=[data_server]
        )

        # Orchestrator with both
        orchestrator = Agent(
            name="Orchestrator",
            instructions="Coordinate task management and data analysis.",
            mcp_servers=[task_server, data_server],
            handoffs=[task_agent, data_agent]
        )

        result = await Runner.run(orchestrator, "Create a task to analyze Q4 data")
        return result.final_output
```

## Best Practices

1. **Clear Agent Boundaries**: Each agent should have a specific responsibility
2. **Explicit Instructions**: Make handoff conditions clear in instructions
3. **Error Handling**: Handle handoff failures gracefully
4. **Context Preservation**: Use input filters to manage context size
5. **Monitoring**: Add tracing for multi-agent workflows
6. **Testing**: Test each agent individually before orchestrating
