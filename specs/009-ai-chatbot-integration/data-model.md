# Data Model: AI Chatbot Integration

**Feature**: 009-ai-chatbot-integration
**Date**: 2026-02-06

## Overview

This document defines the data models for conversation persistence in the AI chatbot feature.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Task       │
│  (existing)     │       │   (existing)    │
├─────────────────┤       ├─────────────────┤
│ id: str (PK)    │       │ id: int (PK)    │
│ email: str      │       │ title: str      │
│ ...             │       │ user_id: str    │
└────────┬────────┘       │ ...             │
         │                └─────────────────┘
         │ 1:N
         │
┌────────▼────────┐
│  Conversation   │
├─────────────────┤       ┌─────────────────┐
│ id: str (PK)    │ 1:N   │    Message      │
│ user_id: str    │◄──────┼─────────────────┤
│ created_at      │       │ id: int (PK)    │
│ updated_at      │       │ conversation_id │
└─────────────────┘       │ role: str       │
                          │ content: str    │
                          │ created_at      │
                          └─────────────────┘
```

## Entities

### Conversation

Represents a chat session between a user and the AI agent.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PK, UUID | Unique conversation identifier |
| `user_id` | str | NOT NULL, INDEX | Owner of the conversation |
| `created_at` | datetime | NOT NULL | When conversation started |
| `updated_at` | datetime | NOT NULL | Last activity (for retention) |

**Business Rules:**
- One user can have multiple conversations
- Conversations are auto-deleted 30 days after `updated_at`
- `user_id` is extracted from JWT, never from request body

**SQLModel Definition:**

```python
from datetime import datetime
from sqlmodel import SQLModel, Field
import uuid

class Conversation(SQLModel, table=True):
    """A chat session between a user and the AI agent."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Message

A single exchange in a conversation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, AUTO | Unique message identifier |
| `conversation_id` | str | FK, NOT NULL, INDEX | Parent conversation |
| `role` | str | NOT NULL | "user" or "assistant" |
| `content` | str | NOT NULL | Message text |
| `created_at` | datetime | NOT NULL | When message was created |

**Business Rules:**
- Messages are ordered by `created_at` within a conversation
- Role is either "user" (human) or "assistant" (AI agent)
- Content is plain text (no HTML/markdown rendering in storage)
- Messages cascade delete when conversation is deleted

**SQLModel Definition:**

```python
from datetime import datetime
from sqlmodel import SQLModel, Field

class Message(SQLModel, table=True):
    """A single message in a conversation."""

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: str = Field(
        foreign_key="conversation.id",
        index=True
    )
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

## Pydantic Schemas

### Request Schemas

```python
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    """Incoming chat request from user."""

    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: str | None = Field(
        None,
        description="ID of existing conversation to continue, or None to start new"
    )
```

### Response Schemas

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ChatResponse(BaseModel):
    """Response from the AI agent."""

    conversation_id: str
    message: str
    actions_taken: list[str] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """Summary of a conversation."""

    id: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """A single message in response format."""

    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## CRUD Operations

### Conversation CRUD

```python
def create_conversation(user_id: str) -> Conversation:
    """Create a new conversation for a user."""
    with get_session() as session:
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        return conversation


def get_conversation(
    conversation_id: str,
    user_id: str
) -> Conversation | None:
    """Get a conversation by ID, verifying ownership."""
    with get_session() as session:
        return session.exec(
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .where(Conversation.user_id == user_id)
        ).first()


def get_or_create_conversation(
    user_id: str,
    conversation_id: str | None = None
) -> Conversation:
    """Get existing conversation or create new one."""
    if conversation_id:
        conversation = get_conversation(conversation_id, user_id)
        if conversation:
            return conversation
    return create_conversation(user_id)


def update_conversation_timestamp(conversation_id: str) -> None:
    """Update the updated_at timestamp for retention tracking."""
    with get_session() as session:
        conversation = session.get(Conversation, conversation_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
            session.add(conversation)
            session.commit()


def delete_old_conversations(days: int = 30) -> int:
    """Delete conversations older than specified days. Returns count deleted."""
    with get_session() as session:
        cutoff = datetime.utcnow() - timedelta(days=days)
        old_conversations = session.exec(
            select(Conversation)
            .where(Conversation.updated_at < cutoff)
        ).all()

        count = len(old_conversations)
        for conv in old_conversations:
            session.delete(conv)

        session.commit()
        return count
```

### Message CRUD

```python
def add_message(
    conversation_id: str,
    role: str,
    content: str
) -> Message:
    """Add a message to a conversation."""
    with get_session() as session:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        session.add(message)
        session.commit()
        session.refresh(message)
        return message


def get_messages(
    conversation_id: str,
    limit: int = 20
) -> list[Message]:
    """Get messages for a conversation, ordered chronologically."""
    with get_session() as session:
        messages = session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        ).all()
        return list(reversed(messages))  # Chronological order
```

## Database Migrations

### Create Tables SQL

```sql
-- Conversation table
CREATE TABLE conversation (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_user_id ON conversation(user_id);
CREATE INDEX idx_conversation_updated_at ON conversation(updated_at);

-- Message table
CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_conversation_id ON message(conversation_id);
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Conversation | user_id | Must match JWT subject |
| Conversation | updated_at | Auto-updated on any message add |
| Message | role | Must be "user" or "assistant" |
| Message | content | 1-10,000 characters |
| ChatRequest | message | 1-10,000 characters |

## Retention Policy

- Conversations are retained for 30 days from last activity
- `updated_at` is refreshed on every message add
- Cleanup job runs daily (or on-demand)
- Cascade delete removes all messages with conversation
