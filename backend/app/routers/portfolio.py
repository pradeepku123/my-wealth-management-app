"""Portfolio management routes."""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models import Investment, InvestmentCreate, InvestmentUpdate, MessageResponse, PortfolioSummary, AssetBreakdown
from app.response_models import APIResponse, success_response, error_response
from app.database import get_db_connection
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/funds", response_model=APIResponse, responses={
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
        return success_response(data=funds, message="Investments retrieved successfully")
    except Exception as e:
        logger.error(f"Get funds error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve investments"
        )


@router.post("/funds", response_model=APIResponse, responses={
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
        
        # If it's a mutual fund, update the mutual_funds table
        if fund_data.investment_type == 'mutual_fund':
            update_mutual_fund_data(cursor, fund_data.fund_name)
        
        conn.commit()
        cursor.close()
        conn.close()
        return success_response(data={"id": fund_id}, message="Investment added successfully")
    except Exception as e:
        logger.error(f"Add fund error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to add investment"
        )


@router.put("/funds/{fund_id}", response_model=APIResponse, responses={
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
        
        return success_response(message="Investment updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update fund error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update investment"
        )


@router.delete("/funds/{fund_id}", response_model=APIResponse, responses={
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
        return success_response(message="Investment deleted successfully")
    except Exception as e:
        logger.error(f"Delete fund error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete investment"
        )


@router.get("/summary", response_model=APIResponse, responses={
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
        
        return success_response(
            data={
                "total_invested": total_invested,
                "total_current": total_current,
                "total_returns": total_returns,
                "return_percentage": (total_returns / total_invested * 100) if total_invested > 0 else 0
            },
            message="Portfolio summary retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Portfolio summary error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve portfolio summary"
        )


@router.get("/asset-breakdown", response_model=APIResponse, responses={
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
        
        return success_response(data=result, message="Asset breakdown retrieved successfully")
    except Exception as e:
        logger.error(f"Asset breakdown error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve asset breakdown"
        )


@router.get("/mutual-funds-nav", response_model=APIResponse, responses={
    500: {"description": "Internal server error"}
})
def get_user_mutual_funds_nav():
    """
    Get NAV data for user's invested mutual funds from database.
    
    Returns NAV data for mutual funds that the user has invested in,
    stored in the mutual_funds table.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get mutual fund data from database for user's investments
        cursor.execute(
            """
            SELECT DISTINCT mf.scheme_code, mf.scheme_name, mf.nav, mf.nav_date, mf.fund_house, mf.category, mf.sub_category
            FROM mutual_funds mf
            INNER JOIN investments i ON i.investment_type = 'mutual_fund'
            WHERE i.fund_name LIKE '%(' || mf.scheme_code || ')%'
            ORDER BY mf.category, mf.sub_category, mf.scheme_name
            """
        )
        funds_data = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = []
        for fund in funds_data:
            result.append({
                "scheme_code": fund['scheme_code'],
                "scheme_name": fund['scheme_name'],
                "nav": float(fund['nav']),
                "date": fund['nav_date'],
                "fund_house": fund['fund_house'],
                "category": fund['category'],
                "sub_category": fund['sub_category']
            })
        
        return success_response(data=result, message="Mutual funds NAV data retrieved successfully")
        
    except Exception as e:
        logger.error(f"Mutual funds NAV error: {str(e)}")
        return success_response(data=[], message="Unable to fetch mutual funds NAV data")


def update_mutual_fund_data(cursor, fund_name):
    """Update mutual fund NAV data for a specific fund."""
    try:
        # Extract scheme code from fund name
        scheme_code = None
        if '(' in fund_name and ')' in fund_name:
            code = fund_name.split('(')[-1].split(')')[0]
            if code.isdigit():
                scheme_code = code
        
        if not scheme_code:
            return
        
        # Fetch NAV data from AMFI
        import requests
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
                        # Insert or update mutual fund data
                        cursor.execute(
                            """
                            INSERT INTO mutual_funds (scheme_code, scheme_name, nav, nav_date, fund_house, updated_at)
                            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (scheme_code) DO UPDATE SET
                                scheme_name = EXCLUDED.scheme_name,
                                nav = EXCLUDED.nav,
                                nav_date = EXCLUDED.nav_date,
                                fund_house = EXCLUDED.fund_house,
                                updated_at = CURRENT_TIMESTAMP
                            """,
                            (parts[0], parts[3], float(parts[4]), parts[5], parts[2] if len(parts) > 2 else "Unknown")
                        )
                        break
                    except ValueError:
                        continue
    except Exception as e:
        logger.error(f"Update mutual fund data error: {str(e)}")

@router.post("/sync-mutual-funds", response_model=APIResponse)
def sync_mutual_funds():
    """Manually sync mutual fund data for common scheme codes."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Common mutual fund scheme codes
        scheme_codes = ['145137', '147946', '120503', '119551', '120716', '118989', '119226']
        
        import requests
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
                        from app.scheduler import classify_fund
                        scheme_name = parts[3]
                        category, sub_category = classify_fund(scheme_name)
                        
                        cursor.execute(
                            """
                            INSERT INTO mutual_funds (scheme_code, scheme_name, nav, nav_date, fund_house, category, sub_category, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (scheme_code) DO UPDATE SET
                                scheme_name = EXCLUDED.scheme_name,
                                nav = EXCLUDED.nav,
                                nav_date = EXCLUDED.nav_date,
                                fund_house = EXCLUDED.fund_house,
                                category = EXCLUDED.category,
                                sub_category = EXCLUDED.sub_category,
                                updated_at = CURRENT_TIMESTAMP
                            """,
                            (parts[0], scheme_name, float(parts[4]), parts[5], parts[2] if len(parts) > 2 else "Unknown", category, sub_category)
                        )
                        updated_count += 1
                    except ValueError:
                        continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return success_response(data={"updated_count": updated_count}, message=f"Synced {updated_count} mutual funds")
        
    except Exception as e:
        logger.error(f"Sync mutual funds error: {str(e)}")
        return success_response(data={"updated_count": 0}, message="Failed to sync mutual funds")