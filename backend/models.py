import uuid
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class TaskDependencyType(str, enum.Enum):
    FS = "FS"
    SS = "SS"
    FF = "FF"
    SF = "SF"

class UpdateStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class RoadblockCategory(str, enum.Enum):
    Weather = "Weather"
    Material = "Material"
    Manpower = "Manpower"
    RFI = "RFI"

class RoadblockStatus(str, enum.Enum):
    active = "active"
    resolved = "resolved"

class UserRole(str, enum.Enum):
    Superintendent = "Superintendent"
    PM = "PM"

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    mpp_file_path = Column(String, nullable=True)
    raw_xml_content = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=True)
    target_completion_date = Column(DateTime, nullable=True)

    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"))
    uid = Column(String, nullable=True) # Original MS Project UID
    wbs_code = Column(String, nullable=True)
    name = Column(String, nullable=False)
    planned_start = Column(DateTime, nullable=True)
    planned_finish = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_finish = Column(DateTime, nullable=True)
    percent_complete = Column(Integer, default=0)
    is_critical_path = Column(Boolean, default=False)
    notes = Column(String, nullable=True)

    project = relationship("Project", back_populates="tasks")
    predecessors = relationship("TaskDependency", foreign_keys="[TaskDependency.successor_task_id]", back_populates="successor_task")
    successors = relationship("TaskDependency", foreign_keys="[TaskDependency.predecessor_task_id]", back_populates="predecessor_task")
    updates = relationship("TaskUpdate", back_populates="task")
    roadblocks = relationship("Roadblock", back_populates="task")

class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    id = Column(String, primary_key=True, default=generate_uuid)
    predecessor_task_id = Column(String, ForeignKey("tasks.id"))
    successor_task_id = Column(String, ForeignKey("tasks.id"))
    type = Column(SQLEnum(TaskDependencyType), default=TaskDependencyType.FS)
    lag_days = Column(Integer, default=0)

    predecessor_task = relationship("Task", foreign_keys=[predecessor_task_id], back_populates="successors")
    successor_task = relationship("Task", foreign_keys=[successor_task_id], back_populates="predecessors")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.Superintendent)
    current_streak = Column(Integer, default=0)
    ppc_score = Column(Integer, default=0)

class TaskUpdate(Base):
    __tablename__ = "task_updates"
    id = Column(String, primary_key=True, default=generate_uuid)
    task_id = Column(String, ForeignKey("tasks.id"))
    user_id = Column(String, ForeignKey("users.id"))
    status = Column(SQLEnum(UpdateStatus), default=UpdateStatus.pending)
    requested_actual_start = Column(DateTime, nullable=True)
    requested_actual_finish = Column(DateTime, nullable=True)
    requested_percent_complete = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="updates")
    user = relationship("User")

class Roadblock(Base):
    __tablename__ = "roadblocks"
    id = Column(String, primary_key=True, default=generate_uuid)
    task_id = Column(String, ForeignKey("tasks.id"))
    user_id = Column(String, ForeignKey("users.id"))
    category = Column(SQLEnum(RoadblockCategory), nullable=False)
    note = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(SQLEnum(RoadblockStatus), default=RoadblockStatus.active)

    task = relationship("Task", back_populates="roadblocks")
    user = relationship("User")
