from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.schemas.response import APIResponse
from app.utils.response import success_response

from fastapi.encoders import jsonable_encoder

router = APIRouter()

@router.get("/available-investments", response_model=APIResponse)
def get_available_investments(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve investments that have remaining unallocated amount.
    """
    from app.models.goal_investment import GoalInvestment
    from sqlalchemy import func
    
    investments = crud.investment.get_multi_by_owner(db, owner_id=current_user.id)
    result = []
    
    for inv in investments:
        # Calculate used amount
        used_amount = db.query(func.sum(GoalInvestment.allocated_amount))\
            .filter(GoalInvestment.investment_id == inv.id)\
            .scalar() or 0
            
        remaining = float(inv.current_value or 0) - float(used_amount)
        
        # Include all investments, but calculate remaining amount
        inv_data = jsonable_encoder(inv)
        inv_data['remaining_amount'] = max(0, remaining) # Ensure non-negative
        result.append(inv_data)
            
    return success_response(data=result, message="Available investments retrieved successfully")

@router.get("", response_model=APIResponse)
def read_goals(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve goals.
    """
    goals = crud.goal.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit
    )
    
    # Calculate current amount and progress for each goal
    for goal in goals:
        current_val = 0
        linked_ids = []
        for assoc in goal.investment_associations:
            current_val += float(assoc.allocated_amount or 0)
            linked_ids.append(assoc.investment_id)
            
        goal.current_amount = current_val
        if goal.target_amount > 0:
            goal.progress = (float(current_val) / float(goal.target_amount)) * 100
        else:
            goal.progress = 0
        goal.linked_investments = linked_ids
            
    return success_response(data=jsonable_encoder(goals), message="Goals retrieved successfully")

@router.post("", response_model=APIResponse)
def create_goal(
    *,
    db: Session = Depends(deps.get_db),
    goal_in: schemas.GoalCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new goal.
    """
    goal = crud.goal.create_with_owner(db=db, obj_in=goal_in, owner_id=current_user.id)
    return success_response(data=jsonable_encoder(goal), message="Goal created successfully")

@router.put("/{goal_id}/link-investments", response_model=APIResponse)
def link_investments_to_goal(
    *,
    db: Session = Depends(deps.get_db),
    goal_id: int,
    investment_ids: List[int] = Body(..., embed=True),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Link investments to a goal.
    """
    goal = crud.goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    goal = crud.goal.link_investments(db=db, goal_id=goal_id, investment_ids=investment_ids)
    
    # Recalculate for response
    current_val = 0
    linked_ids = []
    for assoc in goal.investment_associations:
        current_val += float(assoc.allocated_amount or 0)
        linked_ids.append(assoc.investment_id)
        
    goal.current_amount = current_val
    if goal.target_amount > 0:
        goal.progress = (float(current_val) / float(goal.target_amount)) * 100
    else:
        goal.progress = 0
    goal.linked_investments = linked_ids
    
    return success_response(data=jsonable_encoder(goal), message="Investments linked successfully")
