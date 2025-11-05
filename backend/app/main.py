"""Main FastAPI application module."""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from app.auth import authenticate_user, create_access_token, Token, UserLogin
from psycopg2.extras import RealDictCursor
from app.database import init_database

app = FastAPI()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """
    Root endpoint returning a welcome message.
    """
    return {"message": "Welcome to wealth Management App"}


@app.get("/health/db")
def check_db():
    """Check database connection."""
    try:
        conn = psycopg2.connect(
            host="db",
            database="wealth_db",
            user="postgres",
            password="examplepassword"
        )
        conn.close()
        return {"status": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/auth/login", response_model=Token)
def login(user_credentials: UserLogin):
    """Login endpoint."""
    user = authenticate_user(user_credentials.user_id, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect user ID or password"
        )
    access_token = create_access_token(data={"sub": user["user_id"]})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/forgot-password")
def forgot_password(user_data: dict):
    """Forgot password endpoint."""
    user_id = user_data.get("user_id")
    
    # Check if user exists
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # In a real app, you would send an email here
    # For demo purposes, we'll just return a success message
    return {"message": f"Password reset instructions sent to {user_id}"}


@app.post("/auth/reset-password")
def reset_password(reset_data: dict):
    """Reset password endpoint."""
    user_id = reset_data.get("user_id")
    new_password = reset_data.get("new_password")
    
    if not user_id or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID and new password are required"
        )
    
    # Update password in database
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    
    # Check if user exists and update password
    cursor.execute(
        "UPDATE users SET password = %s WHERE user_id = %s RETURNING user_id",
        (new_password, user_id)
    )
    updated_user = cursor.fetchone()
    
    conn.commit()
    cursor.close()
    conn.close()
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "Password reset successfully"}


@app.get("/portfolio/funds")
def get_funds():
    """Get all investments."""
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM investments ORDER BY id")
    funds = cursor.fetchall()
    cursor.close()
    conn.close()
    return funds


@app.post("/portfolio/funds")
def add_fund(fund_data: dict):
    """Add new investment."""
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO investments (investment_type, fund_name, invested_amount, current_value) VALUES (%s, %s, %s, %s) RETURNING id",
        (fund_data['investment_type'], fund_data['fund_name'], fund_data['invested_amount'], fund_data['current_value'])
    )
    fund_id = cursor.fetchone()['id']
    conn.commit()
    cursor.close()
    conn.close()
    return {"id": fund_id, "message": "Investment added successfully"}


@app.put("/portfolio/funds/{fund_id}")
def update_fund(fund_id: int, fund_data: dict):
    """Update investment."""
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE investments SET investment_type = %s, fund_name = %s, invested_amount = %s, current_value = %s WHERE id = %s RETURNING id",
        (fund_data['investment_type'], fund_data['fund_name'], fund_data['invested_amount'], fund_data['current_value'], fund_id)
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


@app.delete("/portfolio/funds/{fund_id}")
def delete_fund(fund_id: int):
    """Delete investment."""
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute("DELETE FROM investments WHERE id = %s", (fund_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Investment deleted successfully"}


@app.get("/portfolio/summary")
def get_portfolio_summary():
    """Get portfolio summary for dashboard."""
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
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


@app.get("/portfolio/asset-breakdown")
def get_asset_breakdown():
    """Get portfolio breakdown by asset type."""
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
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
    
    # Calculate returns for each asset type
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


@app.get("/market/mutual-funds")
def get_mutual_fund_nav():
    """Get Indian mutual fund NAV data."""
    import requests
    
    try:
        # AMFI NAV data URL
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            # Fallback to mock data
            return get_mock_mutual_funds()
        
        lines = response.text.strip().split('\n')
        funds = []
        
        for line in lines[1:]:  # Skip header
            if ';' in line:
                parts = line.split(';')
                if len(parts) >= 6:
                    scheme_code = parts[0]
                    scheme_name = parts[3]
                    nav = parts[4]
                    date = parts[5]
                    
                    # Filter popular funds
                    if any(keyword in scheme_name.upper() for keyword in ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK']):
                        if 'DIRECT' in scheme_name.upper() and 'GROWTH' in scheme_name.upper():
                            try:
                                funds.append({
                                    "scheme_code": scheme_code,
                                    "scheme_name": scheme_name,
                                    "nav": float(nav),
                                    "date": date
                                })
                                if len(funds) >= 10:  # Limit to 10 funds
                                    break
                            except ValueError:
                                continue
        
        return funds[:10] if funds else get_mock_mutual_funds()
        
    except Exception as e:
        return get_mock_mutual_funds()


def get_mock_mutual_funds():
    """Mock mutual fund data for fallback."""
    return [
        {"scheme_code": "120503", "scheme_name": "SBI Bluechip Fund - Direct Plan - Growth", "nav": 65.45, "date": "15-Jan-2024"},
        {"scheme_code": "119551", "scheme_name": "HDFC Top 100 Fund - Direct Plan - Growth", "nav": 785.23, "date": "15-Jan-2024"},
        {"scheme_code": "120716", "scheme_name": "ICICI Prudential Value Discovery Fund - Direct - Growth", "nav": 156.78, "date": "15-Jan-2024"},
        {"scheme_code": "118989", "scheme_name": "Axis Bluechip Fund - Direct Plan - Growth", "nav": 45.67, "date": "15-Jan-2024"},
        {"scheme_code": "119226", "scheme_name": "Kotak Standard Multicap Fund - Direct Plan - Growth", "nav": 52.34, "date": "15-Jan-2024"}
    ]


@app.get("/market/mutual-funds/filter")
def get_filtered_mutual_funds(codes: str):
    """Get mutual funds by specific scheme codes (comma-separated)."""
    import requests
    
    scheme_codes = [code.strip() for code in codes.split(',')]
    
    try:
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
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
        
        return funds
        
    except Exception as e:
        return []


@app.get("/market/mutual-fund/{scheme_code}")
def get_mutual_fund_details(scheme_code: str):
    """Get specific mutual fund details by scheme code."""
    import requests
    
    try:
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            
            for line in lines[1:]:
                if ';' in line:
                    parts = line.split(';')
                    if len(parts) >= 6 and parts[0] == scheme_code:
                        return {
                            "scheme_code": parts[0],
                            "scheme_name": parts[3],
                            "nav": float(parts[4]),
                            "date": parts[5],
                            "fund_house": parts[2] if len(parts) > 2 else "Unknown"
                        }
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mutual fund with scheme code {scheme_code} not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Mutual fund data service unavailable"
        )
