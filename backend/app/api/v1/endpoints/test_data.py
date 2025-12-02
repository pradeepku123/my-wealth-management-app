from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.investment import Investment
from app.models.sip_estimation import SIPEstimation
from app.utils.response import success_response
from app.schemas.response import APIResponse
from app.models.mutual_fund import MutualFund
from app.models.swp_estimation import SWPEstimation
from app.models.budget import Budget, BudgetItem
from app.models.goal import Goal
from app.utils.fund_classifier import classify_fund
import random
from datetime import date, timedelta

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

    # Sample Mutual Funds
    mf_data = [
        {"scheme_code": "119551", "scheme_name": "HDFC Top 100 Fund - Direct Plan - Growth Option", "nav": 850.50, "fund_house": "HDFC Mutual Fund"},
        {"scheme_code": "125497", "scheme_name": "SBI Small Cap Fund - Direct Plan - Growth", "nav": 160.20, "fund_house": "SBI Mutual Fund"},
        {"scheme_code": "100001", "scheme_name": "Reliance Fixed Fund - Direct Plan - Growth", "nav": 10.00, "fund_house": "Reliance Mutual Fund"},
    ]

    for mf in mf_data:
        category, sub_category = classify_fund(mf["scheme_name"])
        mutual_fund = MutualFund(
            scheme_code=mf["scheme_code"],
            scheme_name=mf["scheme_name"],
            nav=mf["nav"],
            nav_date="01-Dec-2024",
            fund_house=mf["fund_house"],
            category=category,
            sub_category=sub_category
        )
        db.merge(mutual_fund)

    # Sample SWP Estimations
    swp_data = [
        {"name": "Retirement Income", "total_investment": 10000000, "withdrawal_per_month": 50000, "return_rate": 8, "time_period": 20},
        {"name": "Child Education Support", "total_investment": 2000000, "withdrawal_per_month": 15000, "return_rate": 9, "time_period": 5},
    ]

    for swp in swp_data:
        # Basic SWP Calculation for test data
        months = swp["time_period"] * 12
        monthly_rate = swp["return_rate"] / 100 / 12
        
        current_balance = float(swp["total_investment"])
        total_withdrawn = 0
        
        for _ in range(months):
            # Interest for the month
            interest = current_balance * monthly_rate
            # Add interest
            current_balance += interest
            # Withdraw
            current_balance -= swp["withdrawal_per_month"]
            total_withdrawn += swp["withdrawal_per_month"]
            
            if current_balance < 0:
                current_balance = 0
                break
                
        swp_est = SWPEstimation(
            name=swp["name"],
            total_investment=swp["total_investment"],
            withdrawal_per_month=swp["withdrawal_per_month"],
            return_rate=swp["return_rate"],
            time_period=swp["time_period"],
            total_withdrawn=total_withdrawn,
            final_value=current_balance,
            owner_id=current_user.id
        )
        db.add(swp_est)

    # Sample Budgets
    budget_data = [
        {
            "name": "Monthly Home Budget",
            "monthly_income": 150000,
            "items": [
                {"category_name": "Rent", "amount": 25000},
                {"category_name": "Groceries", "amount": 15000},
                {"category_name": "Utilities", "amount": 5000},
                {"category_name": "Entertainment", "amount": 10000},
                {"category_name": "Savings", "amount": 50000},
            ]
        },
        {
            "name": "Vacation Plan 2025",
            "monthly_income": 200000,
            "items": [
                {"category_name": "Flights", "amount": 60000},
                {"category_name": "Hotels", "amount": 50000},
                {"category_name": "Food", "amount": 30000},
                {"category_name": "Activities", "amount": 20000},
            ]
        }
    ]

    for budget_in in budget_data:
        budget = Budget(
            name=budget_in["name"],
            monthly_income=budget_in["monthly_income"],
            owner_id=current_user.id
        )
        db.add(budget)
        db.flush() # Get ID
        
        for item in budget_in["items"]:
            budget_item = BudgetItem(
                budget_id=budget.id,
                category_name=item["category_name"],
                amount=item["amount"]
            )
            db.add(budget_item)

    # Sample Goals
    goal_data = [
        {"name": "Buy a House", "target_amount": 5000000, "target_date": date.today() + timedelta(days=365*5), "monthly_sip_amount": 50000},
        {"name": "World Tour", "target_amount": 1000000, "target_date": date.today() + timedelta(days=365*2), "monthly_sip_amount": 35000},
    ]

    for goal_in in goal_data:
        goal = Goal(
            name=goal_in["name"],
            target_amount=goal_in["target_amount"],
            target_date=goal_in["target_date"],
            monthly_sip_amount=goal_in["monthly_sip_amount"],
            owner_id=current_user.id
        )
        db.add(goal)

    db.commit()
    
    return success_response(message="Test data populated successfully")
