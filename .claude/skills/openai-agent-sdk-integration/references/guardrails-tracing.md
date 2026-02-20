# Guardrails and Tracing

## Guardrails Overview

Guardrails validate inputs and outputs to ensure safety and quality.

| Type | When | Purpose |
|------|------|---------|
| Input Guardrail | Before agent processes | Validate user input |
| Output Guardrail | After agent completes | Validate response |
| Tool Guardrail | Before/after tool calls | Validate tool usage |

## Input Guardrails

### Basic Input Guardrail
```python
from agents import Agent, Runner, input_guardrail, GuardrailFunctionOutput

@input_guardrail
async def content_policy_guardrail(ctx, agent, input_text):
    """Block inappropriate content."""
    blocked_words = ["spam", "malicious", "forbidden"]

    for word in blocked_words:
        if word.lower() in input_text.lower():
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                output_info={"reason": f"Blocked word detected: {word}"}
            )

    return GuardrailFunctionOutput(tripwire_triggered=False)

agent = Agent(
    name="SafeAgent",
    instructions="Be helpful.",
    input_guardrails=[content_policy_guardrail]
)
```

### Guardrail with AI Validation
```python
from agents import Agent, Runner, input_guardrail, GuardrailFunctionOutput

@input_guardrail
async def ai_content_guardrail(ctx, agent, input_text):
    """Use AI to validate content safety."""

    validator = Agent(
        name="ContentValidator",
        instructions="""Analyze if the input is safe.
        Return 'SAFE' if appropriate, 'UNSAFE' if not."""
    )

    result = await Runner.run(validator, input_text)

    if "UNSAFE" in result.final_output:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info={"reason": "Content flagged as unsafe"}
        )

    return GuardrailFunctionOutput(tripwire_triggered=False)
```

### Parallel vs Blocking Guardrails
```python
# Parallel (default): Guardrail runs alongside agent
# - Lower latency
# - Agent may consume tokens before cancellation
@input_guardrail
async def parallel_guardrail(ctx, agent, input_text):
    # Runs in parallel with agent
    return GuardrailFunctionOutput(tripwire_triggered=False)

# Blocking: Guardrail completes before agent starts
# - Higher latency
# - No wasted tokens if blocked
@input_guardrail(run_in_parallel=False)
async def blocking_guardrail(ctx, agent, input_text):
    # Agent waits for this to complete
    return GuardrailFunctionOutput(tripwire_triggered=False)
```

## Output Guardrails

### Basic Output Guardrail
```python
from agents import Agent, output_guardrail, GuardrailFunctionOutput

@output_guardrail
async def pii_guardrail(ctx, agent, output):
    """Detect and block PII in responses."""
    import re

    # Simple patterns (use proper PII detection in production)
    patterns = [
        r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
        r'\b\d{16}\b',  # Credit card
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'  # Email
    ]

    for pattern in patterns:
        if re.search(pattern, output):
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                output_info={"reason": "PII detected in response"}
            )

    return GuardrailFunctionOutput(tripwire_triggered=False)

agent = Agent(
    name="SecureAgent",
    instructions="Be helpful but never expose PII.",
    output_guardrails=[pii_guardrail]
)
```

### Output Quality Guardrail
```python
from pydantic import BaseModel
from agents import Agent, output_guardrail, GuardrailFunctionOutput

class QualityScore(BaseModel):
    score: int  # 1-10
    issues: list[str]

@output_guardrail
async def quality_guardrail(ctx, agent, output):
    """Ensure response quality."""

    quality_checker = Agent(
        name="QualityChecker",
        instructions="Score response quality 1-10. List issues.",
        output_type=QualityScore
    )

    result = await Runner.run(quality_checker, f"Evaluate: {output}")
    score: QualityScore = result.final_output

    if score.score < 5:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info={"score": score.score, "issues": score.issues}
        )

    return GuardrailFunctionOutput(tripwire_triggered=False)
```

## Tool Guardrails

### Input Tool Guardrail
```python
from agents import function_tool, tool_input_guardrail, GuardrailFunctionOutput

@tool_input_guardrail
async def validate_tool_input(ctx, tool_name, tool_args):
    """Validate tool inputs before execution."""

    # Block dangerous operations
    if tool_name == "delete_file":
        if tool_args.get("path", "").startswith("/"):
            return GuardrailFunctionOutput(
                tripwire_triggered=True,
                skip_tool_call=True,  # Skip the tool call
                output_info={"reason": "Cannot delete root files"}
            )

    return GuardrailFunctionOutput(tripwire_triggered=False)

@function_tool
@tool_input_guardrail(validate_tool_input)
def delete_file(path: str) -> str:
    """Delete a file."""
    import os
    os.remove(path)
    return f"Deleted {path}"
```

### Output Tool Guardrail
```python
from agents import tool_output_guardrail, GuardrailFunctionOutput

@tool_output_guardrail
async def sanitize_tool_output(ctx, tool_name, tool_output):
    """Sanitize tool outputs."""

    # Redact sensitive data
    if "password" in tool_output.lower():
        return GuardrailFunctionOutput(
            tripwire_triggered=False,
            modified_output="[REDACTED - sensitive data removed]"
        )

    return GuardrailFunctionOutput(tripwire_triggered=False)
```

## Handling Guardrail Triggers

```python
from agents import Runner, InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered

try:
    result = await Runner.run(agent, user_input)
    print(result.final_output)
except InputGuardrailTripwireTriggered as e:
    print(f"Input blocked: {e.guardrail_result.output_info}")
except OutputGuardrailTripwireTriggered as e:
    print(f"Output blocked: {e.guardrail_result.output_info}")
```

## Tracing

### Basic Tracing
```python
from agents import trace, Runner

# Wrap multiple runs in a single trace
with trace("Customer Support Workflow"):
    result1 = await Runner.run(agent, "First query")
    result2 = await Runner.run(agent, "Follow-up query")

# Trace is automatically created for single runs
result = await Runner.run(agent, "Query")  # Auto-traced
```

### Named Traces
```python
from agents import trace

with trace(
    workflow_name="TaskManagement",
    trace_id="custom-trace-123",
    group_id="user-session-456"
):
    result = await Runner.run(agent, "Create a task")
```

### Custom Spans
```python
from agents import custom_span

async def complex_operation():
    with custom_span("Data Processing"):
        # Processing logic
        data = await fetch_data()

    with custom_span("Analysis"):
        # Analysis logic
        result = analyze(data)

    return result
```

### Trace Configuration
```python
from agents import Runner, RunConfig

config = RunConfig(
    tracing_disabled=False,  # Enable tracing
    trace_include_sensitive_data=False,  # Hide sensitive data
    workflow_name="MyWorkflow",
    trace_id="trace-123",
    group_id="group-456"
)

result = await Runner.run(agent, "Query", run_config=config)
```

### Disable Tracing
```python
import os

# Via environment variable
os.environ["OPENAI_AGENTS_DISABLE_TRACING"] = "true"

# Via RunConfig
config = RunConfig(tracing_disabled=True)
result = await Runner.run(agent, "Query", run_config=config)
```

## Custom Trace Processors

### Add Custom Processor
```python
from agents import add_trace_processor

class MyTraceProcessor:
    def on_trace_start(self, trace):
        print(f"Trace started: {trace.trace_id}")

    def on_span_start(self, span):
        print(f"Span started: {span.name}")

    def on_span_end(self, span):
        print(f"Span ended: {span.name}")

    def on_trace_end(self, trace):
        print(f"Trace ended: {trace.trace_id}")

# Add to default processors
add_trace_processor(MyTraceProcessor())
```

### Replace All Processors
```python
from agents import set_trace_processors

# Replace all processors (removes default OpenAI backend)
set_trace_processors([MyTraceProcessor()])
```

### Third-Party Integrations
```python
# LangSmith
from langsmith.wrappers import OpenAIAgentsTracingProcessor
from agents import set_trace_processors

set_trace_processors([OpenAIAgentsTracingProcessor()])

# Other supported integrations:
# - Weights & Biases
# - Arize Phoenix
# - MLflow
# - Braintrust
# - Langfuse
```

## Sensitive Data Handling

```python
from agents import RunConfig

# Hide sensitive data in traces
config = RunConfig(
    trace_include_sensitive_data=False,  # Default: True
    trace_include_sensitive_audio_data=False  # For voice
)

# Via environment variable
os.environ["OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA"] = "false"
```

## Complete Example

```python
from agents import (
    Agent, Runner, RunConfig,
    input_guardrail, output_guardrail, GuardrailFunctionOutput,
    trace
)

# Input guardrail
@input_guardrail
async def safety_guardrail(ctx, agent, input_text):
    if len(input_text) > 10000:
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info={"reason": "Input too long"}
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)

# Output guardrail
@output_guardrail
async def response_guardrail(ctx, agent, output):
    if "error" in output.lower():
        return GuardrailFunctionOutput(
            tripwire_triggered=True,
            output_info={"reason": "Error in response"}
        )
    return GuardrailFunctionOutput(tripwire_triggered=False)

# Agent with guardrails
agent = Agent(
    name="SafeAgent",
    instructions="Be helpful and safe.",
    input_guardrails=[safety_guardrail],
    output_guardrails=[response_guardrail]
)

async def main():
    config = RunConfig(
        workflow_name="SafeWorkflow",
        trace_include_sensitive_data=False
    )

    with trace("User Session"):
        try:
            result = await Runner.run(
                agent,
                "Hello, how are you?",
                run_config=config
            )
            print(result.final_output)
        except Exception as e:
            print(f"Guardrail triggered: {e}")

asyncio.run(main())
```

## Best Practices

### Guardrails
1. **Layer guardrails**: Use multiple guardrails for defense in depth
2. **Use blocking mode** for critical validation
3. **Log guardrail triggers** for monitoring
4. **Test guardrails** independently
5. **Keep guardrails fast** to minimize latency

### Tracing
1. **Enable in production** for observability
2. **Disable sensitive data** in traces
3. **Use meaningful workflow names**
4. **Integrate with monitoring systems**
5. **Review traces** for debugging and optimization
