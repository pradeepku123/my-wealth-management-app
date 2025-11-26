from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SIPEstimationBase(BaseModel):
    name: Optional[str] = None
    sip_type: str
    amount: float
    return_rate: float
    time_period: int
    total_invested: float
    estimated_returns: float
    total_value: float

class SIPEstimationCreate(SIPEstimationBase):
    pass

class SIPEstimation(SIPEstimationBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
