from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TaskBase(BaseModel):
    name: str
    planned_start: Optional[datetime] = None
    planned_finish: Optional[datetime] = None
    percent_complete: int = 0
    is_critical_path: bool = False
    notes: Optional[str] = None
    wbs_code: Optional[str] = None

class TaskCreate(TaskBase):
    project_id: str
    uid: Optional[str] = None

class Task(TaskBase):
    id: str
    actual_start: Optional[datetime] = None
    actual_finish: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    start_date: Optional[datetime] = None
    target_completion_date: Optional[datetime] = None

class Project(ProjectBase):
    id: str
    mpp_file_path: Optional[str] = None
    start_date: Optional[datetime] = None
    target_completion_date: Optional[datetime] = None
    tasks: List[Task] = []

    class Config:
        from_attributes = True

class TaskUpdateCreate(BaseModel):
    requested_actual_start: Optional[datetime] = None
    requested_actual_finish: Optional[datetime] = None
    requested_percent_complete: Optional[int] = None

class TaskUpdateReject(BaseModel):
    rejection_note: str

class TaskUpdateResponse(BaseModel):
    id: str
    task_id: str
    status: str
    requested_actual_start: Optional[datetime] = None
    requested_actual_finish: Optional[datetime] = None
    requested_percent_complete: Optional[int] = None
    submitted_at: datetime
    rejection_note: Optional[str] = None
    task: Task

    class Config:
        from_attributes = True

class RoadblockCreate(BaseModel):
    category: str
    note: Optional[str] = None
    photo_url: Optional[str] = None

class RoadblockResponse(RoadblockCreate):
    id: str
    task_id: str
    reported_at: datetime
    status: str
    task: Task

    class Config:
        from_attributes = True
