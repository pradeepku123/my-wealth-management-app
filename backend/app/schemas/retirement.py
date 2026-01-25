from typing import List, Optional, Literal
from pydantic import BaseModel
from datetime import datetime

class FundInput(BaseModel):
    name: str
    allocationAmount: float
    expectedGrowthRate: float
    withdrawalRate: float
    taxCategory: Literal['Equity', 'Debt', 'Other']

class RebalancingRule(BaseModel):
    sourceFundIndex: int
    destinationFundIndex: int
    amount: float
    percentageAmount: Optional[float] = None
    frequency: int

class RetirementPlanBase(BaseModel):
    name: str
    start_age: int
    end_age: int
    inflation_rate: float
    total_corpus: float
    funds: List[FundInput]
    rebalancing_rules: List[RebalancingRule]

class RetirementPlanCreate(RetirementPlanBase):
    pass

class RetirementPlanUpdate(RetirementPlanBase):
    pass

class RetirementPlanInDBBase(RetirementPlanBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class RetirementPlan(RetirementPlanInDBBase):
    pass
