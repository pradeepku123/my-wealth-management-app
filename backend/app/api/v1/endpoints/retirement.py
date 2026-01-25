from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, crud
from app.api import deps
from app.schemas.retirement import RetirementPlan, RetirementPlanCreate

router = APIRouter()

@router.get("/", response_model=schemas.APIResponse[List[RetirementPlan]])
def read_retirement_plans(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve retirement plans.
    """
    plans = crud.retirement.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return {"success": True, "data": plans, "message": "Retirement plans retrieved successfully"}

@router.post("/", response_model=schemas.APIResponse[RetirementPlan])
def create_retirement_plan(
    *,
    db: Session = Depends(deps.get_db),
    plan_in: RetirementPlanCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new retirement plan.
    """
    plan = crud.retirement.create_with_owner(
        db=db, obj_in=plan_in, owner_id=current_user.id
    )
    return {"success": True, "data": plan, "message": "Retirement plan saved successfully"}

@router.delete("/{id}", response_model=schemas.APIResponse[RetirementPlan])
def delete_retirement_plan(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a retirement plan.
    """
    plan = crud.retirement.get(db=db, id=id)
    if not plan:
        raise HTTPException(status_code=404, detail="Retirement plan not found")
    if plan.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    plan = crud.retirement.remove(db=db, id=id)
    return {"success": True, "data": plan, "message": "Retirement plan deleted successfully"}
