from typing import List
from fastapi import APIRouter
from app.schemas.models import MutualFund
from app.schemas.response import APIResponse

router = APIRouter()

import requests
import concurrent.futures
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException
from app.schemas.models import MutualFund
from app.schemas.response import APIResponse

router = APIRouter()

# Selected Universe of Funds to Analyze
FUNDS_UNIVERSE = {
    "Large Cap": [
        "122639", # Parag Parikh Flexi Cap Fund - Direct Plan - Growth (Flexi, but large bias)
        "106235", # Nippon india large cap Direct Growth
    ],
    "Mid Cap": [
        "140228", # Edelweiss Mid Cap Fund - Direct Plan - Growth
        "127042", # Motilal Oswal Mid Cap Fund - Direct Plan - Growth
    ],
    "Small Cap": [
        "147946", # Bandhan Small Cap Fund - Direct Plan - Growth
        "145137", # Invesco India Small Cap Fund - Direct Plan - Growth
    ],
    "Hybrid": [
        "120334", # ICIC Pru Multi Asset Fund - Direct Plan - Growth
    ]
    ,
    "Debt": [
        "120754", # ICICI Prudential Short Term Fund - Direct Plan - Growth Option
        "119016", # HDFC Short Term debt Fund - Direct Plan - Growth Option
    ]
}

def fetch_fund_data(scheme_code: str) -> Optional[Dict]:
    try:
        response = requests.get(f"https://api.mfapi.in/mf/{scheme_code}", timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching {scheme_code}: {e}")
    return None

def parse_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%d-%m-%Y")

def calculate_rolling_returns(nav_data: List[Dict], years: int = 3) -> float:
    """
    Calculate average rolling returns for the given period (in years).
    """
    if not nav_data:
        return 0.0
    
    # Sort data by date ascending
    sorted_data = sorted(nav_data, key=lambda x: parse_date(x['date']))
    
    # Convert to a more accessible format: [(date, nav)]
    history = []
    for entry in sorted_data:
        try:
            d = parse_date(entry['date'])
            n = float(entry['nav'])
            history.append((d, n))
        except ValueError:
            continue
            
    if not history:
        return 0.0

    window_days = years * 365
    rolling_returns = []
    
    # Create a lookup for faster access or just iterate
    # Since data is daily, we can look back approx index. 
    # But dates might have gaps.
    
    # Efficient approach: Two pointers
    start_idx = 0
    for end_idx in range(len(history)):
        end_date, end_nav = history[end_idx]
        
        # Move start_idx until we find a date >= end_date - window_days
        target_date = end_date - timedelta(days=window_days)
        
        while start_idx < end_idx and history[start_idx][0] < target_date:
            start_idx += 1
            
        # Check if we found a valid start date (within a small margin, e.g., 7 days)
        if start_idx < end_idx:
            start_date, start_nav = history[start_idx]
            days_diff = (end_date - start_date).days
            
            # Allow some tolerance (e.g., +/- 7 days from target window)
            if abs(days_diff - window_days) <= 7 and start_nav > 0 and days_diff > 0:
                # Calculate CAGR
                cagr = ((end_nav / start_nav) ** (365 / days_diff)) - 1
                rolling_returns.append(cagr * 100)

    if not rolling_returns:
        return 0.0
        
    return sum(rolling_returns) / len(rolling_returns)

# Cache for all funds list
ALL_FUNDS_CACHE = []
LAST_CACHE_UPDATE = None

def get_all_funds_list() -> List[Dict]:
    global ALL_FUNDS_CACHE, LAST_CACHE_UPDATE
    
    # Refresh cache if empty or older than 24 hours
    if not ALL_FUNDS_CACHE or (LAST_CACHE_UPDATE and datetime.now() - LAST_CACHE_UPDATE > timedelta(hours=24)):
        try:
            response = requests.get("https://api.mfapi.in/mf", timeout=10)
            if response.status_code == 200:
                ALL_FUNDS_CACHE = response.json()
                LAST_CACHE_UPDATE = datetime.now()
        except Exception as e:
            print(f"Error fetching all funds list: {e}")
            
    return ALL_FUNDS_CACHE

@router.get("/search", response_model=APIResponse[Dict])
def search_mutual_funds(query: str, limit: int = 20, offset: int = 0):
    """
    Search for mutual funds by name with pagination.
    """
    if len(query) < 3:
        return APIResponse(
            success=False,
            message="Query must be at least 3 characters long",
            data={"results": [], "total": 0, "has_more": False}
        )
        
    all_funds = get_all_funds_list()
    
    query = query.lower()
    # Filter funds
    matching_funds = [
        fund for fund in all_funds 
        if query in fund.get('schemeName', '').lower()
    ]
    
    total_matches = len(matching_funds)
    paginated_results = matching_funds[offset : offset + limit]
    has_more = (offset + limit) < total_matches
    
    return APIResponse(
        success=True,
        message=f"Found {len(paginated_results)} funds matching '{query}'",
        data={
            "results": paginated_results,
            "total": total_matches,
            "has_more": has_more
        }
    )

@router.get("/mutual-funds", response_model=APIResponse[List[MutualFund]])
def get_recommended_mutual_funds():
    """
    Get a list of recommended mutual funds based on 3-year rolling returns.
    """
    recommendations = []
    
    # Flatten the list of codes to fetch
    all_codes = []
    for codes in FUNDS_UNIVERSE.values():
        all_codes.extend(codes)
        
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_code = {executor.submit(fetch_fund_data, code): code for code in all_codes}
        for future in concurrent.futures.as_completed(future_to_code):
            data = future.result()
            if data:
                results.append(data)
    
    # Process results
    processed_funds = []
    
    for data in results:
        if not data or 'meta' not in data or 'data' not in data:
            continue
            
        meta = data['meta']
        nav_data = data['data']
        
        # Determine category from our universe mapping
        scheme_code = meta['scheme_code']
        category = "Equity" # Default
        sub_category = "Other"
        
        for cat, codes in FUNDS_UNIVERSE.items():
            if str(scheme_code) in codes:
                sub_category = cat
                break
        
        # Calculate Rolling Returns (3 Years)
        rolling_return = calculate_rolling_returns(nav_data, years=3)
        
        # Get latest NAV
        latest_nav = float(nav_data[0]['nav']) if nav_data else 0.0
        latest_date = nav_data[0]['date'] if nav_data else ""
        
        processed_funds.append({
            "scheme_code": str(scheme_code),
            "scheme_name": meta['scheme_name'],
            "nav": latest_nav,
            "nav_date": latest_date,
            "fund_house": meta['fund_house'],
            "category": "Equity",
            "sub_category": sub_category,
            "rolling_return": rolling_return
        })

    # Sort by rolling return descending
    processed_funds.sort(key=lambda x: x['rolling_return'], reverse=True)
    
    # Convert to model
    for fund in processed_funds:
        recommendations.append(MutualFund(
            scheme_code=fund['scheme_code'],
            scheme_name=fund['scheme_name'],
            nav=fund['nav'],
            nav_date=fund['nav_date'],
            fund_house=fund['fund_house'],
            category=fund['category'],
            sub_category=fund['sub_category'],
            rolling_return=fund['rolling_return']
        ))

    return APIResponse(
        success=True,
        message="Recommended mutual funds based on 3-year rolling returns",
        data=recommendations
    )

@router.get("/mutual-funds/{scheme_code}", response_model=APIResponse[Dict])
def get_mutual_fund_details(scheme_code: str):
    """
    Get full details for a specific mutual fund.
    """
    data = fetch_fund_data(scheme_code)
    if not data:
        raise HTTPException(status_code=404, detail="Mutual fund not found")
        
    # Calculate returns for different periods
    nav_data = data.get('data', [])
    returns = {
        "1W": calculate_trailing_return(nav_data, "1W"),
        "1M": calculate_trailing_return(nav_data, "1M"),
        "3M": calculate_trailing_return(nav_data, "3M"),
        "6M": calculate_trailing_return(nav_data, "6M"),
        "1Y": calculate_trailing_return(nav_data, "1Y"),
        "3Y": calculate_trailing_return(nav_data, "3Y"),
        "5Y": calculate_trailing_return(nav_data, "5Y"),
        "Inception": calculate_trailing_return(nav_data, "Inception")
    }
    
    # Add calculated returns to the response
    data['returns'] = returns
    
    # Mock Expense Ratio as it's not available in this API
    # In a real app, this would come from a database or premium API
    data['meta']['expense_ratio'] = "0.75%" 
    
    return APIResponse(
        success=True,
        message="Mutual fund details retrieved successfully",
        data=data
    )

def calculate_trailing_return(nav_data: List[Dict], period: str) -> Optional[float]:
    if not nav_data:
        return None
    
    # Sort data: latest last
    sorted_data = sorted(nav_data, key=lambda x: parse_date(x['date']))
    
    if not sorted_data:
        return None

    latest_entry = sorted_data[-1]
    latest_date = parse_date(latest_entry['date'])
    latest_nav = float(latest_entry['nav'])
    
    target_date = latest_date
    
    if period == '1W':
        target_date = latest_date - timedelta(weeks=1)
    elif period == '1M':
        target_date = latest_date - timedelta(days=30)
    elif period == '3M':
        target_date = latest_date - timedelta(days=90)
    elif period == '6M':
        target_date = latest_date - timedelta(days=180)
    elif period == '1Y':
        target_date = latest_date - timedelta(days=365)
    elif period == '3Y':
        target_date = latest_date - timedelta(days=365*3)
    elif period == '5Y':
        target_date = latest_date - timedelta(days=365*5)
    elif period == 'Inception':
        target_date = parse_date(sorted_data[0]['date'])
    
    # Check if we have enough history
    first_date = parse_date(sorted_data[0]['date'])
    if period != 'Inception' and (latest_date - first_date).days < (latest_date - target_date).days:
        return None

    # Find closest entry to target_date
    # We want the entry closest to target_date but preferably <= target_date to capture the full period
    closest_entry = None
    min_diff = float('inf')
    
    for entry in sorted_data:
        d = parse_date(entry['date'])
        # We look for date close to target_date. 
        # Simple approach: find absolute closest
        diff = abs((d - target_date).days)
        if diff < min_diff:
            min_diff = diff
            closest_entry = entry
            
    if closest_entry:
        start_nav = float(closest_entry['nav'])
        start_date = parse_date(closest_entry['date'])
        
        days_diff = (latest_date - start_date).days
        if days_diff == 0: return 0.0
        
        # For periods > 1 year, use CAGR. For < 1 year, use Absolute Return.
        # Standard practice: 1Y and above is CAGR.
        if days_diff >= 365:
             # CAGR
             return (((latest_nav / start_nav) ** (365 / days_diff)) - 1) * 100
        else:
             # Absolute Return
             return ((latest_nav - start_nav) / start_nav) * 100
             
    return None
