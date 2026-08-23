from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, select
from sqlalchemy.sql import func
import enum
from services.database import Base

class AgentStatus(str, enum.Enum):
    IDLE = "idle"
    WORKING = "working"
    OFFLINE = "offline"

class Subagent(Base):
    __tablename__ = "subagents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    role = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=False)
    status = Column(Enum(AgentStatus), default=AgentStatus.IDLE)
    current_task = Column(Text, nullable=True)
    tasks_completed = Column(Integer, default=0)
    avatar_color = Column(String, default="#007AFF")
    created_at = Column(DateTime, server_default=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "description": self.description,
            "icon": self.icon,
            "status": self.status.value,
            "current_task": self.current_task,
            "tasks_completed": self.tasks_completed,
            "avatar_color": self.avatar_color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
