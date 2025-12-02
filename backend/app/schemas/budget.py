from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BudgetItemBase(BaseModel):
    category_name: str
    amount: float

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItem(BudgetItemBase):
    id: int
    budget_id: int

    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    name: str
    monthly_income: float

class BudgetCreate(BudgetBase):
    items: List[BudgetItemCreate]

class Budget(BudgetBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[BudgetItem] = []

    class Config:
        from_attributes = True
