from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/list", response_model=schemas.APIResponse[List[schemas.SIPEstimation]])
def read_sip_estimations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve SIP estimations.
    """
    estimations = (
        db.query(models.SIPEstimation)
        .filter(models.SIPEstimation.owner_id == current_user.id)
        .order_by(models.SIPEstimation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"success": True, "data": estimations, "message": "SIP estimations retrieved successfully"}

@router.post("/save", response_model=schemas.APIResponse[schemas.SIPEstimation])
def create_sip_estimation(
    *,
    db: Session = Depends(deps.get_db),
    sip_in: schemas.SIPEstimationCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new SIP estimation.
    """
    sip = models.SIPEstimation(
        **sip_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(sip)
    db.commit()
    db.refresh(sip)
    return {"success": True, "data": sip, "message": "SIP estimation saved successfully"}

@router.delete("/{id}", response_model=schemas.APIResponse)
def delete_sip_estimation(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a SIP estimation.
    """
    sip = db.query(models.SIPEstimation).filter(models.SIPEstimation.id == id, models.SIPEstimation.owner_id == current_user.id).first()
    if not sip:
        raise HTTPException(status_code=404, detail="SIP estimation not found")
    db.delete(sip)
    db.commit()
    return {"success": True, "data": None, "message": "SIP estimation deleted successfully"}
