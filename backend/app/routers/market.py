"""Market data routes."""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models import MutualFund
from app.response_models import APIResponse, success_response, error_response
import requests
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["market"])


@router.get("/mutual-funds", response_model=APIResponse, responses={
    503: {"description": "Service unavailable"}
})
def get_mutual_fund_nav():
    """
    Get popular Indian mutual fund NAV data.
    
    Fetches real-time NAV (Net Asset Value) data from AMFI (Association of Mutual Funds in India).
    Returns top 10 popular direct growth funds from major fund houses.
    
    **Data Source:** AMFI Official NAV Data
    
    **Fund Houses Included:**
    - SBI, HDFC, ICICI, Axis, Kotak
    
    **Filter Criteria:**
    - Direct plans only
    - Growth option only
    - Popular fund houses
    
    **Fallback:** Returns mock data if AMFI service is unavailable
    """
    try:
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            logger.warning("AMFI service unavailable, using mock data")
            return get_mock_mutual_funds()
        
        lines = response.text.strip().split('\n')
        funds = []
        
        for line in lines[1:]:
            if ';' in line:
                parts = line.split(';')
                if len(parts) >= 6:
                    scheme_code = parts[0]
                    scheme_name = parts[3]
                    nav = parts[4]
                    date = parts[5]
                    
                    if any(keyword in scheme_name.upper() for keyword in ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK']):
                        if 'DIRECT' in scheme_name.upper() and 'GROWTH' in scheme_name.upper():
                            try:
                                funds.append({
                                    "scheme_code": scheme_code,
                                    "scheme_name": scheme_name,
                                    "nav": float(nav),
                                    "date": date
                                })
                                if len(funds) >= 10:
                                    break
                            except ValueError:
                                continue
        
        return success_response(
            data=funds[:10] if funds else get_mock_mutual_funds(),
            message="Mutual funds data retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Mutual funds error: {str(e)}")
        return success_response(
            data=get_mock_mutual_funds(),
            message="Mutual funds data retrieved (fallback)"
        )


@router.get("/mutual-funds/filter", response_model=APIResponse, responses={
    400: {"description": "Invalid scheme codes"},
    503: {"description": "Service unavailable"}
})
def get_filtered_mutual_funds(codes: str):
    """
    Get mutual funds by specific scheme codes.
    
    Fetches NAV data for specific mutual funds using their AMFI scheme codes.
    
    **Query Parameters:**
    - **codes**: Comma-separated list of AMFI scheme codes (e.g., "145137,147946")
    
    **Example Usage:**
    ```
    GET /market/mutual-funds/filter?codes=145137,147946
    ```
    
    **Popular Scheme Codes:**
    - 145137: Invesco India Smallcap Fund - Direct Plan - Growth
    - 147946: Bandhan Small Cap Fund - Direct Plan Growth
    
    **Response:** List of mutual funds with current NAV, date, and fund house information
    """
    if not codes or not codes.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheme codes parameter is required"
        )
    
    scheme_codes = [code.strip() for code in codes.split(',')]
    
    try:
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            logger.warning("AMFI service unavailable for filtered funds")
            return []
        
        lines = response.text.strip().split('\n')
        funds = []
        
        for line in lines[1:]:
            if ';' in line:
                parts = line.split(';')
                if len(parts) >= 6 and parts[0] in scheme_codes:
                    try:
                        funds.append({
                            "scheme_code": parts[0],
                            "scheme_name": parts[3],
                            "nav": float(parts[4]),
                            "date": parts[5],
                            "fund_house": parts[2] if len(parts) > 2 else "Unknown"
                        })
                    except ValueError:
                        continue
        
        return success_response(data=funds, message="Filtered mutual funds retrieved successfully")
        
    except Exception as e:
        logger.error(f"Filtered mutual funds error: {str(e)}")
        return success_response(data=[], message="No mutual funds found for given codes")


@router.get("/mutual-fund/{scheme_code}", response_model=APIResponse, responses={
    404: {"description": "Mutual fund not found"},
    503: {"description": "Service unavailable"}
})
def get_mutual_fund_details(scheme_code: str):
    """
    Get detailed information for a specific mutual fund.
    
    Retrieves comprehensive details for a single mutual fund using its AMFI scheme code.
    
    **Path Parameters:**
    - **scheme_code**: AMFI scheme code (e.g., "145137")
    
    **Example Usage:**
    ```
    GET /market/mutual-fund/145137
    ```
    
    **Response Includes:**
    - Scheme code and name
    - Current NAV (Net Asset Value)
    - NAV date
    - Fund house name
    
    **Error Cases:**
    - 404: Scheme code not found in AMFI database
    - 503: AMFI service temporarily unavailable
    """
    try:
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            
            for line in lines[1:]:
                if ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 6 and parts[0] == scheme_code:
                        return success_response(
                            data={
                                "scheme_code": parts[0],
                                "scheme_name": parts[3],
                                "nav": float(parts[4]),
                                "date": parts[5],
                                "fund_house": parts[2] if len(parts) > 2 else "Unknown"
                            },
                            message="Mutual fund details retrieved successfully"
                        )
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mutual fund with scheme code {scheme_code} not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mutual fund details error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Mutual fund data service unavailable"
        )


def get_mock_mutual_funds():
    """Mock mutual fund data for fallback."""
    return [
        {"scheme_code": "120503", "scheme_name": "SBI Bluechip Fund - Direct Plan - Growth", "nav": 65.45, "date": "15-Jan-2024"},
        {"scheme_code": "119551", "scheme_name": "HDFC Top 100 Fund - Direct Plan - Growth", "nav": 785.23, "date": "15-Jan-2024"},
        {"scheme_code": "120716", "scheme_name": "ICICI Prudential Value Discovery Fund - Direct - Growth", "nav": 156.78, "date": "15-Jan-2024"},
        {"scheme_code": "118989", "scheme_name": "Axis Bluechip Fund - Direct Plan - Growth", "nav": 45.67, "date": "15-Jan-2024"},
        {"scheme_code": "119226", "scheme_name": "Kotak Standard Multicap Fund - Direct Plan - Growth", "nav": 52.34, "date": "15-Jan-2024"}
    ]