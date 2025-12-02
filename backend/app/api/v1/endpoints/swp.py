from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/list", response_model=schemas.APIResponse[List[schemas.SWPEstimation]])
def read_swp_estimations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve SWP estimations.
    """
    estimations = (
        db.query(models.SWPEstimation)
        .filter(models.SWPEstimation.owner_id == current_user.id)
        .order_by(models.SWPEstimation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"success": True, "data": estimations, "message": "SWP estimations retrieved successfully"}

@router.post("/save", response_model=schemas.APIResponse[schemas.SWPEstimation])
def create_swp_estimation(
    *,
    db: Session = Depends(deps.get_db),
    swp_in: schemas.SWPEstimationCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new SWP estimation.
    """
    swp = models.SWPEstimation(
        **swp_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(swp)
    db.commit()
    db.refresh(swp)
    return {"success": True, "data": swp, "message": "SWP estimation saved successfully"}

@router.delete("/{id}", response_model=schemas.APIResponse)
def delete_swp_estimation(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a SWP estimation.
    """
    swp = db.query(models.SWPEstimation).filter(models.SWPEstimation.id == id, models.SWPEstimation.owner_id == current_user.id).first()
    if not swp:
        raise HTTPException(status_code=404, detail="SWP estimation not found")
    db.delete(swp)
    db.commit()
    return {"success": True, "data": None, "message": "SWP estimation deleted successfully"}
