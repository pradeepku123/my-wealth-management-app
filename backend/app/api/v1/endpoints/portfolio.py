"""Portfolio management routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.response_models import APIResponse, success_response, error_response
import logging
from sqlalchemy import func
from app.models.investment import Investment
from app.models.mutual_fund import MutualFund
import requests
from app.scheduler import classify_fund

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/funds", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
})
def get_funds(db: Session = Depends(deps.get_db)):
    """
    Retrieve all investments in the portfolio.
    """
    funds = crud.investment.get_multi(db)
    return success_response(data=funds, message="Investments retrieved successfully")


@router.post("/funds", response_model=APIResponse, responses={
    400: {"description": "Invalid input data"},
})
def add_fund(fund_data: schemas.InvestmentCreate, db: Session = Depends(deps.get_db)):
    """
    Add a new investment to the portfolio.
    """
    fund = crud.investment.create(db, obj_in=fund_data)
    if fund.investment_type == 'mutual_fund':
        update_mutual_fund_data(db, fund.fund_name)
    return success_response(data={"id": fund.id}, message="Investment added successfully")


@router.put("/funds/{fund_id}", response_model=APIResponse, responses={
    404: {"description": "Investment not found"},
})
def update_fund(fund_id: int, fund_data: schemas.InvestmentUpdate, db: Session = Depends(deps.get_db)):
    """
    Update an existing investment.
    """
    fund = crud.investment.get(db, id=fund_id)
    if not fund:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    fund = crud.investment.update(db, db_obj=fund, obj_in=fund_data)
    return success_response(message="Investment updated successfully")


@router.delete("/funds/{fund_id}", response_model=APIResponse, responses={
    404: {"description": "Investment not found"},
})
def delete_fund(fund_id: int, db: Session = Depends(deps.get_db)):
    """
    Delete an investment from the portfolio.
    """
    fund = crud.investment.get(db, id=fund_id)
    if not fund:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    crud.investment.remove(db, id=fund_id)
    return success_response(message="Investment deleted successfully")


@router.get("/summary", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
})
def get_portfolio_summary(db: Session = Depends(deps.get_db)):
    """
    Get portfolio summary statistics.
    """
    total_invested, total_current = db.query(
        func.sum(Investment.invested_amount),
        func.sum(Investment.current_value)
    ).one()

    total_invested = total_invested or 0
    total_current = total_current or 0
    total_returns = total_current - total_invested
    
    return success_response(
        data={
            "total_invested": total_invested,
            "total_current": total_current,
            "total_returns": total_returns,
            "return_percentage": (total_returns / total_invested * 100) if total_invested > 0 else 0
        },
        message="Portfolio summary retrieved successfully"
    )


@router.get("/asset-breakdown", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
})
def get_asset_breakdown(db: Session = Depends(deps.get_db)):
    """
    Get portfolio breakdown by asset type.
    """
    breakdown = db.query(
        Investment.investment_type,
        func.sum(Investment.invested_amount).label("total_invested"),
        func.sum(Investment.current_value).label("total_current")
    ).group_by(Investment.investment_type).order_by(Investment.investment_type).all()
    
    result = []
    for asset in breakdown:
        total_invested = asset.total_invested or 0
        total_current = asset.total_current or 0
        total_returns = total_current - total_invested
        return_percentage = (total_returns / total_invested * 100) if total_invested > 0 else 0
        
        result.append({
            "investment_type": asset.investment_type,
            "total_invested": total_invested,
            "total_current": total_current,
            "total_returns": total_returns,
            "return_percentage": return_percentage
        })
    
    return success_response(data=result, message="Asset breakdown retrieved successfully")


@router.get("/mutual-funds-nav", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
})
def get_user_mutual_funds_nav(db: Session = Depends(deps.get_db)):
    """
    Get NAV data for user's invested mutual funds from database.
    """
    funds_data = db.query(
        MutualFund
    ).join(
        Investment,
        Investment.fund_name.like('%(' + MutualFund.scheme_code + ')%')
    ).filter(
        Investment.investment_type == 'mutual_fund'
    ).distinct().order_by(
        MutualFund.category,
        MutualFund.sub_category,
        MutualFund.scheme_name
    ).all()
    
    return success_response(data=funds_data, message="Mutual funds NAV data retrieved successfully")


def update_mutual_fund_data(db: Session, fund_name: str):
    """Update mutual fund NAV data for a specific fund."""
    try:
        scheme_code = None
        if '(' in fund_name and ')' in fund_name:
            code = fund_name.split('(')[-1].split(')')[0]
            if code.isdigit():
                scheme_code = code
        
        if not scheme_code:
            return
        
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return
        
        lines = response.text.strip().split('\n')
        
        for line in lines[1:]:
            if ';' in line:
                parts = line.split(';')
                if len(parts) >= 6 and parts[0] == scheme_code:
                    try:
                        scheme_name = parts[3]
                        category, sub_category = classify_fund(scheme_name)
                        fund_in = schemas.MutualFundCreate(
                            scheme_code=parts[0],
                            scheme_name=scheme_name,
                            nav=float(parts[4]),
                            nav_date=parts[5],
                            fund_house=parts[2] if len(parts) > 2 else "Unknown",
                            category=category,
                            sub_category=sub_category
                        )
                        crud.mutual_fund.upsert(db, obj_in=fund_in)
                        break
                    except ValueError:
                        continue
    except Exception as e:
        logger.error(f"Update mutual fund data error: {str(e)}")

@router.post("/sync-mutual-funds", response_model=APIResponse)
def sync_mutual_funds(db: Session = Depends(deps.get_db)):
    """Manually sync mutual fund data for common scheme codes."""
    try:
        scheme_codes = ['145137', '147946', '120503', '119551', '120716', '118989', '119226']
        
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return success_response(data=[], message="Unable to fetch NAV data from AMFI")
        
        lines = response.text.strip().split('\n')
        updated_count = 0
        
        for line in lines[1:]:
            if ';' in line:
                parts = line.split(';')
                if len(parts) >= 6 and parts[0] in scheme_codes:
                    try:
                        scheme_name = parts[3]
                        category, sub_category = classify_fund(scheme_name)
                        fund_in = schemas.MutualFundCreate(
                            scheme_code=parts[0],
                            scheme_name=scheme_name,
                            nav=float(parts[4]),
                            nav_date=parts[5],
                            fund_house=parts[2] if len(parts) > 2 else "Unknown",
                            category=category,
                            sub_category=sub_category
                        )
                        crud.mutual_fund.upsert(db, obj_in=fund_in)
                        updated_count += 1
                    except ValueError:
                        continue
        
        return success_response(data={"updated_count": updated_count}, message=f"Synced {updated_count} mutual funds")
        
    except Exception as e:
        logger.error(f"Sync mutual funds error: {str(e)}")
        return success_response(data={"updated_count": 0}, message="Failed to sync mutual funds")
