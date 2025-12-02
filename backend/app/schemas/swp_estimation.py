from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SWPEstimationBase(BaseModel):
    name: Optional[str] = None
    total_investment: float
    withdrawal_per_month: float
    return_rate: float
    time_period: int
    total_withdrawn: float
    final_value: float

class SWPEstimationCreate(SWPEstimationBase):
    pass

class SWPEstimation(SWPEstimationBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
