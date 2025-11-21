from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.mutual_fund import MutualFund
from app.schemas.response import APIResponse
from app.utils.response import success_response
from app.schemas.models import MutualFund as MutualFundSchema
from typing import List

router = APIRouter()

@router.get("/mutual-funds", response_model=APIResponse[List[MutualFundSchema]])
def get_popular_mutual_funds(db: Session = Depends(deps.get_db)):
    """
    Get a list of all mutual funds.
    """
    funds = db.query(MutualFund).all()
    return success_response(data=funds, message="Mutual funds retrieved successfully")
