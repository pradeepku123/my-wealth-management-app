"""Portfolio management routes."""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models import Investment, InvestmentCreate, InvestmentUpdate, MessageResponse, PortfolioSummary, AssetBreakdown
from app.database import get_db_connection
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/funds", response_model=List[Investment], responses={
    500: {"description": "Internal server error"}
})
def get_funds():
    """
    Retrieve all investments in the portfolio.
    
    Returns a list of all investments with their details including:
    - Investment type (mutual_fund, epf, ppf, fd, mis, nps)
    - Fund name
    - Invested amount
    - Current value
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM investments ORDER BY id")
        funds = cursor.fetchall()
        cursor.close()
        conn.close()
        return funds
    except Exception as e:
        logger.error(f"Get funds error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve investments"
        )


@router.post("/funds", response_model=dict, responses={
    400: {"description": "Invalid input data"},
    500: {"description": "Internal server error"}
})
def add_fund(fund_data: InvestmentCreate):
    """
    Add a new investment to the portfolio.
    
    Creates a new investment record with the provided details.
    All fields are required:
    - **investment_type**: Type of investment (mutual_fund, epf, ppf, fd, mis, nps)
    - **fund_name**: Name of the fund or investment
    - **invested_amount**: Amount invested (decimal)
    - **current_value**: Current market value (decimal)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO investments (investment_type, fund_name, invested_amount, current_value) VALUES (%s, %s, %s, %s) RETURNING id",
            (fund_data.investment_type, fund_data.fund_name, fund_data.invested_amount, fund_data.current_value)
        )
        fund_id = cursor.fetchone()['id']
        conn.commit()
        cursor.close()
        conn.close()
        return {"id": fund_id, "message": "Investment added successfully"}
    except Exception as e:
        logger.error(f"Add fund error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to add investment"
        )


@router.put("/funds/{fund_id}", response_model=MessageResponse, responses={
    404: {"description": "Investment not found"},
    500: {"description": "Internal server error"}
})
def update_fund(fund_id: int, fund_data: InvestmentUpdate):
    """
    Update an existing investment.
    
    Updates the investment details for the specified fund ID.
    
    - **fund_id**: Unique identifier of the investment to update
    - **fund_data**: Updated investment details
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE investments SET investment_type = %s, fund_name = %s, invested_amount = %s, current_value = %s WHERE id = %s RETURNING id",
            (fund_data.investment_type, fund_data.fund_name, fund_data.invested_amount, fund_data.current_value, fund_id)
        )
        updated_fund = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if not updated_fund:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment not found"
            )
        
        return {"message": "Investment updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update fund error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update investment"
        )


@router.delete("/funds/{fund_id}", response_model=MessageResponse, responses={
    500: {"description": "Internal server error"}
})
def delete_fund(fund_id: int):
    """
    Delete an investment from the portfolio.
    
    Permanently removes the investment record with the specified ID.
    
    - **fund_id**: Unique identifier of the investment to delete
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM investments WHERE id = %s", (fund_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Investment deleted successfully"}
    except Exception as e:
        logger.error(f"Delete fund error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete investment"
        )


@router.get("/summary", response_model=PortfolioSummary, responses={
    500: {"description": "Internal server error"}
})
def get_portfolio_summary():
    """
    Get portfolio summary statistics.
    
    Returns aggregated portfolio data including:
    - Total invested amount across all investments
    - Total current value of all investments
    - Total returns (profit/loss)
    - Return percentage
    
    Used for dashboard overview and performance tracking.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT SUM(invested_amount) as total_invested, SUM(current_value) as total_current FROM investments"
        )
        summary = cursor.fetchone()
        cursor.close()
        conn.close()
        
        total_invested = summary['total_invested'] or 0
        total_current = summary['total_current'] or 0
        total_returns = total_current - total_invested
        
        return {
            "total_invested": total_invested,
            "total_current": total_current,
            "total_returns": total_returns,
            "return_percentage": (total_returns / total_invested * 100) if total_invested > 0 else 0
        }
    except Exception as e:
        logger.error(f"Portfolio summary error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve portfolio summary"
        )


@router.get("/asset-breakdown", response_model=List[AssetBreakdown], responses={
    500: {"description": "Internal server error"}
})
def get_asset_breakdown():
    """
    Get portfolio breakdown by asset type.
    
    Returns investment summary grouped by asset type:
    - Mutual Funds
    - EPF (Employee Provident Fund)
    - PPF (Public Provident Fund)
    - FD (Fixed Deposits)
    - MIS (Monthly Income Scheme)
    - NPS (National Pension System)
    
    Each asset type includes total invested, current value, returns, and percentage.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                investment_type,
                SUM(invested_amount) as total_invested,
                SUM(current_value) as total_current
            FROM investments 
            GROUP BY investment_type
            ORDER BY investment_type
            """
        )
        breakdown = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for asset in breakdown:
            total_invested = asset['total_invested'] or 0
            total_current = asset['total_current'] or 0
            total_returns = total_current - total_invested
            return_percentage = (total_returns / total_invested * 100) if total_invested > 0 else 0
            
            result.append({
                "investment_type": asset['investment_type'],
                "total_invested": total_invested,
                "total_current": total_current,
                "total_returns": total_returns,
                "return_percentage": return_percentage
            })
        
        return result
    except Exception as e:
        logger.error(f"Asset breakdown error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve asset breakdown"
        )