from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field


class TaskType(str, Enum):
    assignment = "assignment"
    exam = "exam"
    reading = "reading"
    project = "project"
    other = "other"


class TaskStatus(str, Enum):
    active = "active"
    done = "done"


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)

    title: str
    course: str = ""
    due_at: datetime

    est_minutes: int
    remaining_minutes: int

    difficulty: int = 3  # 1-5
    task_type: TaskType = TaskType.assignment
    status: TaskStatus = TaskStatus.active

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Availability(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, unique=True)

    weekday_minutes: int = 120
    weekend_minutes: int = 240
    chunk_minutes: int = 50  # max chunk size per block
