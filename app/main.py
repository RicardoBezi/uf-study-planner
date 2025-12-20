from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field as PydField
from sqlmodel import Session, select

from .db import init_db, get_session
from .models import Task, Availability
from .planner import TaskLite, generate_week_plan


app = FastAPI(title="UF Study Planner API")


@app.on_event("startup")
def on_startup():
    init_db()


# ----- Request/Response Schemas -----

class TaskCreate(BaseModel):
    user_id: str
    title: str
    course: str = ""
    due_at: datetime
    est_minutes: int = PydField(ge=1)
    difficulty: int = PydField(default=3, ge=1, le=5)
    task_type: str = "assignment"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    course: Optional[str] = None
    due_at: Optional[datetime] = None
    est_minutes: Optional[int] = None
    remaining_minutes: Optional[int] = None
    difficulty: Optional[int] = None
    task_type: Optional[str] = None
    status: Optional[str] = None


class AvailabilityUpsert(BaseModel):
    user_id: str
    weekday_minutes: int = PydField(default=120, ge=0)
    weekend_minutes: int = PydField(default=240, ge=0)
    chunk_minutes: int = PydField(default=50, ge=10, le=120)


class PlanRequest(BaseModel):
    user_id: str
    start_date: Optional[str] = None  # ISO date; optional
    days: int = PydField(default=7, ge=1, le=14)


# ----- Endpoints -----

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/tasks", response_model=Task)
def create_task(payload: TaskCreate, session: Session = Depends(get_session)):
    t = Task(
        user_id=payload.user_id,
        title=payload.title,
        course=payload.course,
        due_at=payload.due_at,
        est_minutes=payload.est_minutes,
        remaining_minutes=payload.est_minutes,
        difficulty=payload.difficulty,
        task_type=payload.task_type,
        status="active",
    )
    session.add(t)
    session.commit()
    session.refresh(t)
    return t


@app.get("/tasks", response_model=List[Task])
def list_tasks(user_id: str, session: Session = Depends(get_session)):
    stmt = select(Task).where(Task.user_id == user_id).order_by(Task.due_at.asc())
    return list(session.exec(stmt))


@app.patch("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, payload: TaskUpdate, session: Session = Depends(get_session)):
    t = session.get(Task, task_id)
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(t, k, v)

    # keep remaining_minutes sane if est_minutes is updated
    if "est_minutes" in data and "remaining_minutes" not in data:
        # don’t auto-increase remaining if user already logged time; keep min
        t.remaining_minutes = min(t.remaining_minutes, t.est_minutes)

    session.add(t)
    session.commit()
    session.refresh(t)
    return t


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    t = session.get(Task, task_id)
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(t)
    session.commit()
    return {"deleted": True}


@app.post("/availability", response_model=Availability)
def upsert_availability(payload: AvailabilityUpsert, session: Session = Depends(get_session)):
    stmt = select(Availability).where(Availability.user_id == payload.user_id)
    existing = session.exec(stmt).first()

    if existing:
        existing.weekday_minutes = payload.weekday_minutes
        existing.weekend_minutes = payload.weekend_minutes
        existing.chunk_minutes = payload.chunk_minutes
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    a = Availability(**payload.model_dump())
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


@app.get("/availability", response_model=Availability)
def get_availability(user_id: str, session: Session = Depends(get_session)):
    stmt = select(Availability).where(Availability.user_id == user_id)
    a = session.exec(stmt).first()
    if not a:
        # return defaults if not set
        a = Availability(user_id=user_id)
        session.add(a)
        session.commit()
        session.refresh(a)
    return a


@app.post("/plan/generate")
def generate_plan(payload: PlanRequest, session: Session = Depends(get_session)):
    # availability (defaults if missing)
    avail = get_availability(payload.user_id, session)

    # active tasks only
    stmt = select(Task).where(Task.user_id == payload.user_id, Task.status == "active")
    tasks = list(session.exec(stmt))

    task_lites = [
        TaskLite(
            id=t.id,
            title=t.title,
            course=t.course,
            due_at=t.due_at,
            remaining_minutes=max(0, t.remaining_minutes),
            difficulty=t.difficulty,
        )
        for t in tasks
        if t.remaining_minutes > 0
    ]

    if payload.start_date:
        from datetime import date as _date
        start = _date.fromisoformat(payload.start_date)
    else:
        start = None

    plan = generate_week_plan(
        tasks=task_lites,
        weekday_minutes=avail.weekday_minutes,
        weekend_minutes=avail.weekend_minutes,
        chunk_minutes=avail.chunk_minutes,
        start=start,
        days=payload.days,
    )
    return {"userId": payload.user_id, "plan": plan}
