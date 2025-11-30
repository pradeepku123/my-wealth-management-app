from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.investment import Investment
from app.models.sip_estimation import SIPEstimation
from app.utils.response import success_response
from app.schemas.response import APIResponse
import random

router = APIRouter()

@router.post("/populate", response_model=APIResponse)
def populate_test_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Populate the database with test data for the current user.
    """
    
    # Sample Investments
    investments_data = [
        {"investment_type": "mutual_fund", "fund_name": "HDFC Top 100 Fund", "invested_amount": 50000, "current_value": 55000},
        {"investment_type": "mutual_fund", "fund_name": "SBI Small Cap Fund", "invested_amount": 30000, "current_value": 38000},
        {"investment_type": "stock", "fund_name": "Reliance Industries", "invested_amount": 25000, "current_value": 24500},
        {"investment_type": "stock", "fund_name": "TCS", "invested_amount": 40000, "current_value": 42000},
        {"investment_type": "fd", "fund_name": "SBI Fixed Deposit", "invested_amount": 100000, "current_value": 105000},
        {"investment_type": "gold", "fund_name": "Sovereign Gold Bond", "invested_amount": 20000, "current_value": 22000},
        {"investment_type": "nps", "fund_name": "HDFC Pension Fund Scheme E", "invested_amount": 150000, "current_value": 185000},
        {"investment_type": "epf", "fund_name": "Employees Provident Fund", "invested_amount": 500000, "current_value": 580000},
        {"investment_type": "ppf", "fund_name": "SBI Public Provident Fund", "invested_amount": 150000, "current_value": 162000},
        {"investment_type": "mis", "fund_name": "Post Office Monthly Income Scheme", "invested_amount": 450000, "current_value": 450000},
        {"investment_type": "fd", "fund_name": "Post Office Time Deposit (5 Year)", "invested_amount": 200000, "current_value": 225000},
        {"investment_type": "foreign_stock", "fund_name": "Apple Inc.", "invested_amount": 75000, "current_value": 92000},
        {"investment_type": "foreign_stock", "fund_name": "Microsoft Corp", "invested_amount": 60000, "current_value": 78000},
    ]

    for inv in investments_data:
        investment = Investment(
            investment_type=inv["investment_type"],
            fund_name=inv["fund_name"],
            invested_amount=inv["invested_amount"],
            current_value=inv["current_value"],
            owner_id=current_user.id
        )
        db.add(investment)

    # Sample SIP Estimations
    sip_data = [
        {"name": "Retirement Goal", "sip_type": "Monthly", "amount": 5000, "return_rate": 12, "time_period": 20},
        {"name": "Car Fund", "sip_type": "Monthly", "amount": 10000, "return_rate": 10, "time_period": 5},
    ]

    for sip in sip_data:
        # Simple calculation logic (can be refined)
        total_invested = sip["amount"] * 12 * sip["time_period"]
        # FV = P * (((1 + r)^n - 1) / r) * (1 + r)
        # r = rate / 100 / 12
        # n = months
        monthly_rate = sip["return_rate"] / 100 / 12
        months = sip["time_period"] * 12
        
        if monthly_rate > 0:
            future_value = sip["amount"] * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
        else:
            future_value = total_invested
            
        estimated_returns = future_value - total_invested

        sip_est = SIPEstimation(
            name=sip["name"],
            sip_type=sip["sip_type"],
            amount=sip["amount"],
            return_rate=sip["return_rate"],
            time_period=sip["time_period"],
            total_invested=total_invested,
            estimated_returns=estimated_returns,
            total_value=future_value,
            owner_id=current_user.id
        )
        db.add(sip_est)

    db.commit()
    
    return success_response(message="Test data populated successfully")
