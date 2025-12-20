from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Dict, Any


@dataclass
class TaskLite:
    id: int
    title: str
    course: str
    due_at: datetime
    remaining_minutes: int
    difficulty: int


def _days_until(due_at: datetime, on_date: date) -> int:
    return (due_at.date() - on_date).days


def _score(task: TaskLite, on_date: date) -> float:
    days = _days_until(task.due_at, on_date)
    urgency = 1.0 / (days + 1.0)  # closer due date => higher
    diff_weight = 1.0 + 0.15 * max(1, min(5, task.difficulty))
    effort_penalty = 0.01 * max(0, task.remaining_minutes)
    overdue_bonus = 50.0 if days < 0 else 0.0
    return 100.0 * urgency * diff_weight + overdue_bonus - effort_penalty


def generate_week_plan(
    tasks: List[TaskLite],
    weekday_minutes: int,
    weekend_minutes: int,
    chunk_minutes: int,
    start: date | None = None,
    days: int = 7,
) -> List[Dict[str, Any]]:
    """
    Greedy planner:
    - recompute scores daily
    - fill each day’s budget with highest-score tasks
    - split long tasks into chunks (<= chunk_minutes)
    """
    if start is None:
        start = date.today()

    # mutable copy of remaining time
    remaining = {t.id: int(t.remaining_minutes) for t in tasks}

    plan: List[Dict[str, Any]] = []

    for i in range(days):
        day = start + timedelta(days=i)
        is_weekend = day.weekday() >= 5
        budget = int(weekend_minutes if is_weekend else weekday_minutes)

        day_blocks: List[Dict[str, Any]] = []

        available = [t for t in tasks if remaining.get(t.id, 0) > 0]

        if not available or budget <= 0:
            plan.append({"date": day.isoformat(), "blocks": []})
            continue

        # sort by today's score
        available.sort(
            key=lambda t: _score(
                TaskLite(
                    id=t.id,
                    title=t.title,
                    course=t.course,
                    due_at=t.due_at,
                    remaining_minutes=remaining[t.id],
                    difficulty=t.difficulty,
                ),
                day,
            ),
            reverse=True,
        )

        idx = 0
        while budget > 0 and available:
            t = available[idx % len(available)]
            rem = remaining[t.id]
            if rem <= 0:
                idx += 1
                available = [x for x in available if remaining.get(x.id, 0) > 0]
                continue

            block = min(int(chunk_minutes), rem, budget)

            day_blocks.append(
                {
                    "taskId": t.id,
                    "title": t.title,
                    "course": t.course,
                    "minutes": block,
                    "dueAt": t.due_at.isoformat(),
                }
            )

            remaining[t.id] -= block
            budget -= block
            idx += 1

            available = [x for x in available if remaining.get(x.id, 0) > 0]

        plan.append({"date": day.isoformat(), "blocks": day_blocks})

    return plan
