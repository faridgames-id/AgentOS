from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from models.subagent import Subagent, AgentStatus
from services.database import get_db

router = APIRouter()

# Predefined agents with Vision UI styling
AGENTS = [
    {"name": "NOVA", "role": "Research & Analysis", "icon": "flame", "color": "#FF6B35"},
    {"name": "CIPHER", "role": "Code & Development", "icon": "code", "color": "#00D4FF"},
    {"name": "ATLAS", "role": "Finance & Tracking", "icon": "chart", "color": "#10B981"},
    {"name": "PIXEL", "role": "Image & Creative", "icon": "palette", "color": "#EC4899"},
    {"name": "ORACLE", "role": "Insights & Predictions", "icon": "crystal", "color": "#7C3AED"},
    {"name": "SENTINEL", "role": "Security & Monitoring", "icon": "shield", "color": "#F59E0B"},
    {"name": "AURORA", "role": "Content & Writing", "icon": "pen", "color": "#8B5CF6"},
    {"name": "PHOENIX", "role": "Automation & Tasks", "icon": "bird", "color": "#EF4444"},
    {"name": "ZEPHRA", "role": "Stock & Inventory Manager", "icon": "bird", "color": "#A855F7"},
]

@router.get("/")
async def get_agents(db: AsyncSession = Depends(get_db)):
    """Get all subagents"""
    result = await db.execute(select(Subagent))
    agents = result.scalars().all()
    
    if not agents:
        # Create default agents
        for agent_data in AGENTS:
            agent = Subagent(
                name=agent_data["name"],
                role=agent_data["role"],
                icon=agent_data["icon"],
                avatar_color=agent_data["color"],
                description=f"Expert {agent_data['role'].lower()} assistant"
            )
            db.add(agent)
        await db.commit()
        result = await db.execute(select(Subagent))
        agents = result.scalars().all()
    
    return {"agents": [a.to_dict() for a in agents], "count": len(agents)}

@router.get("/{agent_id}")
async def get_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Get single agent"""
    result = await db.execute(select(Subagent).where(Subagent.id == agent_id))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_dict()

@router.post("/{agent_id}/task")
async def assign_task(
    agent_id: int,
    task: str,
    db: AsyncSession = Depends(get_db)
):
    """Assign task to agent"""
    result = await db.execute(select(Subagent).where(Subagent.id == agent_id))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(404, "Agent not found")
    
    agent.status = AgentStatus.WORKING
    agent.current_task = task
    await db.commit()
    return agent.to_dict()

@router.post("/{agent_id}/complete")
async def complete_task(
    agent_id: int,
    result_data: dict = {},
    db: AsyncSession = Depends(get_db)
):
    """Mark agent task as complete"""
    stmt = select(Subagent).where(Subagent.id == agent_id)
    agent = (await db.execute(stmt)).scalar_one_or_none()
    
    if not agent:
        raise HTTPException(404, "Agent not found")
    
    agent.status = AgentStatus.IDLE
    agent.current_task = None
    agent.tasks_completed += 1
    await db.commit()
    return agent.to_dict()
