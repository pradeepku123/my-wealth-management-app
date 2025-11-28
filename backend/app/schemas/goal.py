from typing import Optional, List
from datetime import date
from pydantic import BaseModel
from decimal import Decimal

class GoalBase(BaseModel):
    name: str
    target_amount: Decimal
    target_date: date
    monthly_sip_amount: Optional[Decimal] = 0

class GoalCreate(GoalBase):
    pass

class GoalUpdate(GoalBase):
    pass

class GoalInDBBase(GoalBase):
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True

class Goal(GoalInDBBase):
    current_amount: Optional[Decimal] = 0
    progress: Optional[float] = 0
    linked_investments: List[int] = [] # List of Investment IDs

class GoalWithInvestments(Goal):
    pass
