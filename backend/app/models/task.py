# Task Model
# Phase 2.1: Database Persistence Layer
# Task ID: T009-T013 (US1: Task Persistence)

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """
    Task entity for todo items.

    Implements FR-001: Task entity with all required fields.
    """

    __tablename__ = "tasks"

    # Primary key - auto-generated
    id: Optional[int] = Field(default=None, primary_key=True)

    # Required fields
    title: str = Field(max_length=200, nullable=False, index=True)
    user_id: str = Field(max_length=255, nullable=False, index=True)

    # Optional fields
    description: Optional[str] = Field(default=None, max_length=1000)

    # Status field with default
    completed: bool = Field(default=False)

    # Timestamp fields - auto-generated
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )
