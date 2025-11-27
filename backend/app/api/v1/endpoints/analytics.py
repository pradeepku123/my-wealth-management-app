from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app import models
from app.models.investment import Investment
from app.utils.response import success_response
from app.schemas.response import APIResponse

router = APIRouter()

@router.get("/dashboard", response_model=APIResponse)
def get_analytics_dashboard(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """
    Get comprehensive analytics dashboard data.
    """
    # 1. Portfolio Summary
    total_invested, total_current = db.query(
        func.sum(Investment.invested_amount),
        func.sum(Investment.current_value)
    ).filter(Investment.owner_id == current_user.id).one()

    total_invested = total_invested or 0
    total_current = total_current or 0
    total_returns = total_current - total_invested
    return_percentage = (total_returns / total_invested * 100) if total_invested > 0 else 0

    # 2. Asset Allocation
    breakdown = db.query(
        Investment.investment_type,
        func.sum(Investment.current_value).label("total_current")
    ).filter(Investment.owner_id == current_user.id).group_by(Investment.investment_type).all()

    asset_allocation = []
    for asset in breakdown:
        asset_allocation.append({
            "type": asset.investment_type,
            "value": asset.total_current or 0,
            "percentage": (asset.total_current / total_current * 100) if total_current > 0 else 0
        })

    # 3. Performance (Best/Worst)
    # Fetch all investments to calculate individual returns
    investments = db.query(Investment).filter(Investment.owner_id == current_user.id).all()
    
    performers = []
    for inv in investments:
        if inv.invested_amount and inv.invested_amount > 0:
            ret_pct = ((inv.current_value - inv.invested_amount) / inv.invested_amount) * 100
            performers.append({
                "name": inv.fund_name,
                "type": inv.investment_type,
                "return_percentage": ret_pct,
                "absolute_return": inv.current_value - inv.invested_amount
            })
    
    performers.sort(key=lambda x: x["return_percentage"], reverse=True)
    
    best_performer = performers[0] if performers else None
    worst_performer = performers[-1] if performers else None
    top_gainers = performers[:3] if performers else []
    
    # 4. Risk & Diversification
    unique_types = len(set(inv.investment_type for inv in investments))
    diversification_score = min(100, (unique_types / 6) * 100)
    
    risk_level = "Low"
    if return_percentage > 15:
        risk_level = "High"
    elif return_percentage > 8:
        risk_level = "Moderate"

    return success_response(data={
        "summary": {
            "total_invested": total_invested,
            "total_current": total_current,
            "total_returns": total_returns,
            "return_percentage": return_percentage
        },
        "asset_allocation": asset_allocation,
        "performance": {
            "best": best_performer,
            "worst": worst_performer,
            "top_gainers": top_gainers
        },
        "insights": {
            "risk_level": risk_level,
            "diversification_score": diversification_score
        }
    }, message="Analytics dashboard data retrieved successfully")
