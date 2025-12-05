from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.risk_profile import RiskProfile, RiskProfileCreate
from app.crud.crud_risk_profile import risk_profile as crud_risk_profile
from app.models.user import User
from app.schemas.response import APIResponse

router = APIRouter()

def calculate_risk_score(answers: Dict[str, Any]) -> int:
    # Simple scoring logic
    # Assume answers are values like 1, 2, 3, 4
    total_score = 0
    for key, value in answers.items():
        if isinstance(value, int):
            total_score += value
        elif isinstance(value, str) and value.isdigit():
            total_score += int(value)
    return total_score

def determine_risk_category(score: int) -> str:
    if score <= 10:
        return "Conservative"
    elif score <= 15:
        return "Moderate"
    else:
        return "Aggressive"

@router.post("", response_model=APIResponse[RiskProfile])
def create_risk_profile(
    *,
    db: Session = Depends(deps.get_db),
    risk_profile_in: RiskProfileCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create or update user risk profile.
    """
    # Check if exists
    existing_profile = crud_risk_profile.get_by_user(db, user_id=current_user.id)
    
    # Calculate score
    print(f"Received answers: {risk_profile_in.answers}")
    score = calculate_risk_score(risk_profile_in.answers)
    print(f"Calculated score: {score}")
    category = determine_risk_category(score)
    print(f"Determined category: {category}")
    
    if existing_profile:
        # Update
        existing_profile.answers = risk_profile_in.answers
        existing_profile.risk_score = score
        existing_profile.risk_category = category
        db.commit()
        db.refresh(existing_profile)
        return APIResponse(
            success=True,
            message="Risk profile updated successfully",
            data=existing_profile
        )
    else:
        new_profile = crud_risk_profile.create_with_owner(
            db=db, 
            obj_in=risk_profile_in, 
            user_id=current_user.id, 
            risk_score=score, 
            risk_category=category
        )
        return APIResponse(
            success=True,
            message="Risk profile created successfully",
            data=new_profile
        )

@router.get("", response_model=APIResponse[RiskProfile])
def read_risk_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user risk profile.
    """
    profile = crud_risk_profile.get_by_user(db, user_id=current_user.id)
    if not profile:
        # Return empty or specific message instead of 404 to handle UI gracefully
        return APIResponse(
            success=False,
            message="Risk profile not found",
            data=None
        )
    return APIResponse(
        success=True,
        message="Risk profile retrieved successfully",
        data=profile
    )
