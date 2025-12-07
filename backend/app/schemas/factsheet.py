from pydantic import BaseModel
from typing import Optional, Dict, List

class FactSheetAnalysis(BaseModel):
    # 1. Fund Basics
    fund_name: Optional[str] = None
    plan_name: Optional[str] = None
    investment_objective: Optional[str] = None
    scheme_type: Optional[str] = None # Category
    inception_date: Optional[str] = None
    benchmark: Optional[str] = None
    
    # 2. Performance
    nav: Optional[str] = None
    cagr: Optional[Dict[str, str]] = None # {"1 Year": "18.5%", "Benchmark": "15%"}
    sip_returns: Optional[Dict[str, str]] = None # {"1 Year": "20%", "Total Invested": "120000"}
    rolling_returns: Optional[List[Dict[str, str]]] = None 
    
    # 3. Risk Metrics
    risk_metrics: Optional[Dict[str, str]] = None # {"Std Dev": "15.2", "Beta": "0.8", "Sharpe": "1.2", "Alpha": "2.5"}
    riskometer: Optional[str] = None
    
    # 4. Costs
    expense_ratio: Optional[str] = None # Generic fallback
    expense_ratio_direct: Optional[str] = None
    expense_ratio_regular: Optional[str] = None
    
    # 5. Portfolio
    top_holdings: Optional[List[Dict[str, str]]] = None # [{"name": "HDFC Bank", "allocation": "8%"}]
    sector_allocation: Optional[List[Dict[str, str]]] = None # [{"sector": "Banks", "allocation": "20%"}]
    turnover_ratio: Optional[str] = None
    
    # 6. Size
    net_assets: Optional[str] = None
    
    # 7. Liquidity / Exit
    min_investment_sip: Optional[str] = None
    min_investment_lumpsum: Optional[str] = None
    exit_load: Optional[str] = None
    
    # 8. Governance
    fund_manager: Optional[str] = None
    insider_holdings: Optional[str] = None # Skin in the game
    
    raw_text: Optional[str] = None
