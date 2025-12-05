from pydantic import BaseModel
from typing import Dict, Any, Optional

class RiskProfileBase(BaseModel):
    answers: Dict[str, Any]

class RiskProfileCreate(RiskProfileBase):
    pass

class RiskProfileUpdate(RiskProfileBase):
    pass

class RiskProfile(RiskProfileBase):
    id: int
    user_id: int
    risk_score: int
    risk_category: str

    class Config:
        from_attributes = True
