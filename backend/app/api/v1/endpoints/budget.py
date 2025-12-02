from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/list", response_model=schemas.APIResponse[List[schemas.Budget]])
def read_budgets(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve budgets.
    """
    budgets = (
        db.query(models.Budget)
        .filter(models.Budget.owner_id == current_user.id)
        .order_by(models.Budget.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {"success": True, "data": budgets, "message": "Budgets retrieved successfully"}

@router.post("/save", response_model=schemas.APIResponse[schemas.Budget])
def create_budget(
    *,
    db: Session = Depends(deps.get_db),
    budget_in: schemas.BudgetCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new budget.
    """
    # Create Budget
    budget = models.Budget(
        name=budget_in.name,
        monthly_income=budget_in.monthly_income,
        owner_id=current_user.id
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)

    # Create Budget Items
    for item in budget_in.items:
        budget_item = models.BudgetItem(
            budget_id=budget.id,
            category_name=item.category_name,
            amount=item.amount
        )
        db.add(budget_item)
    
    db.commit()
    db.refresh(budget)
    return {"success": True, "data": budget, "message": "Budget saved successfully"}

@router.delete("/{id}", response_model=schemas.APIResponse)
def delete_budget(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a budget.
    """
    budget = db.query(models.Budget).filter(models.Budget.id == id, models.Budget.owner_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return {"success": True, "data": None, "message": "Budget deleted successfully"}

@router.put("/{id}", response_model=schemas.APIResponse[schemas.Budget])
def update_budget(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    budget_in: schemas.BudgetCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a budget.
    """
    budget = db.query(models.Budget).filter(models.Budget.id == id, models.Budget.owner_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    budget.name = budget_in.name
    budget.monthly_income = budget_in.monthly_income
    
    # Delete existing items and re-add (simple approach)
    db.query(models.BudgetItem).filter(models.BudgetItem.budget_id == id).delete()
    
    for item in budget_in.items:
        budget_item = models.BudgetItem(
            budget_id=budget.id,
            category_name=item.category_name,
            amount=item.amount
        )
        db.add(budget_item)
        
    db.commit()
    db.refresh(budget)
    return {"success": True, "data": budget, "message": "Budget updated successfully"}
