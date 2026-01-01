# Task CRUD Operations
# Phase 2.1: Database Persistence Layer
# Task ID: T015-T020 (US2: User Scoping, US3: Full CRUD)

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from ..database import get_session
from ..models import Task


def create_task(
    title: str,
    user_id: str,
    description: Optional[str] = None,
) -> Task:
    """
    Create a new task for a user.

    Implements FR-004: create_task function that accepts task data and user_id,
    returns the created task with generated ID.

    Args:
        title: Task title (required)
        user_id: Owner identifier (required)
        description: Optional task description

    Returns:
        The created Task with auto-generated ID and timestamps
    """
    task = Task(
        title=title,
        user_id=user_id,
        description=description,
        completed=False,
    )

    with get_session() as session:
        session.add(task)
        session.commit()
        session.refresh(task)
        return task


def get_task(task_id: int, user_id: Optional[str] = None) -> Optional[Task]:
    """
    Retrieve a single task by ID.

    Implements FR-005: get_task function that retrieves a single task by ID.

    Args:
        task_id: The task ID to retrieve
        user_id: Optional user_id for ownership filtering

    Returns:
        The Task if found, None otherwise
    """
    with get_session() as session:
        statement = select(Task).where(Task.id == task_id)

        # Apply user scoping if user_id provided
        if user_id is not None:
            statement = statement.where(Task.user_id == user_id)

        result = session.exec(statement).first()
        return result


def get_tasks(user_id: Optional[str] = None) -> list[Task]:
    """
    Retrieve all tasks, optionally filtered by user_id.

    Implements FR-006: get_tasks function that retrieves all tasks,
    optionally filtered by user_id.

    Args:
        user_id: Optional user_id to filter tasks by owner.
                 If None, returns all tasks (admin/debug use case).

    Returns:
        List of tasks matching the criteria
    """
    with get_session() as session:
        statement = select(Task).order_by(Task.created_at.desc())

        # Apply user scoping if user_id provided
        if user_id is not None:
            statement = statement.where(Task.user_id == user_id)

        results = session.exec(statement).all()
        return list(results)


def update_task(
    task_id: int,
    user_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> Optional[Task]:
    """
    Update an existing task's properties.

    Implements FR-007: update_task function that modifies existing task properties.

    Args:
        task_id: The task ID to update
        user_id: Owner identifier (for ownership verification)
        title: New title (optional, only updates if provided)
        description: New description (optional, only updates if provided)

    Returns:
        The updated Task if found and owned by user, None otherwise
    """
    with get_session() as session:
        # Find task with user scoping
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        task = session.exec(statement).first()

        if task is None:
            return None

        # Update provided fields
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description

        # Update timestamp
        task.updated_at = datetime.now(timezone.utc)

        session.add(task)
        session.commit()
        session.refresh(task)
        return task


def delete_task(task_id: int, user_id: str) -> bool:
    """
    Delete a task by ID.

    Implements FR-008: delete_task function that removes a task by ID.

    Args:
        task_id: The task ID to delete
        user_id: Owner identifier (for ownership verification)

    Returns:
        True if task was deleted, False if not found or not owned by user
    """
    with get_session() as session:
        # Find task with user scoping
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        task = session.exec(statement).first()

        if task is None:
            return False

        session.delete(task)
        session.commit()
        return True


def toggle_complete(task_id: int, user_id: str) -> Optional[Task]:
    """
    Toggle the completed status of a task.

    Implements FR-009: toggle_complete function that flips the completed status.

    Args:
        task_id: The task ID to toggle
        user_id: Owner identifier (for ownership verification)

    Returns:
        The updated Task if found and owned by user, None otherwise
    """
    with get_session() as session:
        # Find task with user scoping
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id
        )
        task = session.exec(statement).first()

        if task is None:
            return None

        # Toggle completion status
        task.completed = not task.completed

        # Update timestamp
        task.updated_at = datetime.now(timezone.utc)

        session.add(task)
        session.commit()
        session.refresh(task)
        return task
