import io
import re
from typing import Optional, Dict, List
from pypdf import PdfReader
from app.schemas.factsheet import FactSheetAnalysis

def extract_field(text: str, patterns: list[str]) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            try:
                return match.group(1).strip()
            except IndexError:
                return match.group(0).strip()
    return None

def clean_text(text: str) -> str:
    # Remove excessive whitespace
    return " ".join(text.split())

def analyze_factsheet_pdf(file_content: bytes) -> FactSheetAnalysis:
    try:
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")

    # 1. Basics
    # Clean up common PDF extraction artifacts (merged lines) for headers
    # "May 24, 2013Parag" -> "May 24, 2013 Parag"
    text_cleaned = re.sub(r"(\d{4})([A-Z])", r"\1 \2", text)

    # Fund Name
    fund_name = "Unknown Fund"
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines[:20]:
        if ("Fund" in line or "Scheme" in line) and len(line) < 100 and "Mutual Fund" not in line:
            fund_name = line
            break

    # Objective
    investment_objective = extract_field(text, [
        r"Investment Objective\s*[:\-\u2013]?\s*([\s\S]{1,300}?)(?:\n\n|Benchmark|Date|To seek|$)",
        r"Objective\s*[:\-\u2013]?\s*([\s\S]{1,300}?)(?:\n\n|$)"
    ])
    if investment_objective:
        investment_objective = clean_text(investment_objective)

    scheme_type = extract_field(text, [
        r"Scheme Type\s*[:\-\u2013]?\s*([A-Za-z\s\-&]+)(?:\n|$)",
        r"Category\s*[:\-\u2013]?\s*([A-Za-z\s\-&]+)(?:\n|$)",
        r"(An open-ended dynamic Equity scheme)", # specific fallback
        r"Type of the Scheme\s*[:\-\u2013]?\s*([A-Za-z\s\-&]+)(?:\n|$)"
    ])
    if not scheme_type and "Flexi Cap" in text:
        scheme_type = "Flexi Cap Fund"
    
    inception_date = extract_field(text_cleaned, [
        r"Inception Date\s*[:\-\u2013]?\s*(\S+\s\d{1,2},?\s\d{4})", 
        r"Date of Allotment\s*[:\-\u2013]?\s*(\S+\s\d{1,2},?\s\d{4})",
        r"Allotment Date\s*[:\-\u2013]?\s*(\S+\s\d{1,2},?\s\d{4})",
        # Fallback for "May 24, 2013" appearing alone in header
        r"(\w{3,9}\s\d{1,2},\s\d{4})" 
    ])

    benchmark = extract_field(text, [
        r"Benchmark\s*[:\-\u2013]?\s*([A-Za-z0-9\s\(\)\-]+?)(?:\n|To seek|Investment|$)",
        r"Benchmark Index\s*[:\-\u2013]?\s*([A-Za-z0-9\s\(\)\-]+)(?:\n|$)"
    ])
    if benchmark:
        benchmark = clean_text(benchmark)

    # 2. Performance & NAVs
    # NAV is tricky. Look for numbers typical of NAV (10-1000) near "NAV" or "Direct" / "Regular"
    nav = extract_field(text, [
        r"NAV\s*(?:As on|as of)?.*[:\-\u2013]?\s*(\d+\.?\d*)",
        r"Net Asset Value\s*[:\-\u2013]?\s*(\d+\.?\d*)",
        # Look for table like structure: "Regular Plan 123.45"
        r"Regular\s*(?:Plan)?.*?\s+(\d{2,4}\.\d{2,4})",
        r"Direct\s*(?:Plan)?.*?\s+(\d{2,4}\.\d{2,4})"
    ])
    
    # CAGR Extraction 
    cagr = {}
    # Better CAGr logic: Find the block with "Returns" and then extract percentages
    # Typical PDF: "1 Year   3 Years    5 Years" \n "18.5%    12.2%      15.0%"
    # We will look for period keywords and grab the nearest % number
    
    def find_nearest_percentage(search_text, anchor):
        match = re.search(rf"{anchor}.*?(\d+\.\d+)\s*%", search_text, re.IGNORECASE | re.DOTALL)
        if match:
             return f"{match.group(1)}%"
        # Try looking backwards if anchor is after number? No, usually Label -> Value
        return None

    cagr["1 Year"] = find_nearest_percentage(text, "1 Year") or find_nearest_percentage(text, "Last 1 Year")
    cagr["3 Years"] = find_nearest_percentage(text, "3 Years") or find_nearest_percentage(text, "Last 3 Years")
    cagr["5 Years"] = find_nearest_percentage(text, "5 Years") or find_nearest_percentage(text, "Last 5 Years")
    cagr["Since Inception"] = find_nearest_percentage(text, "Since Inception")

    # Filter None values
    cagr = {k: v for k, v in cagr.items() if v}

    # 3. Risk Metrics
    risk_metrics = {}
    std_dev = extract_field(text, [r"Std\.? Deviation\s*[:\-\u2013]?\s*(\d+\.?\d*)"])
    beta = extract_field(text, [r"Beta\s*[:\-\u2013]?\s*(\d+\.?\d*)"])
    sharpe = extract_field(text, [r"Sharpe Ratio\s*[:\-\u2013]?\s*(\d+\.?\d*)"])
    
    if std_dev: risk_metrics["Standard Deviation"] = std_dev
    if beta: risk_metrics["Beta"] = beta
    if sharpe: risk_metrics["Sharpe Ratio"] = sharpe
    
    riskometer = extract_field(text, [r"Riskometer\s*[:\-\u2013]?\s*([A-Za-z\s]+)(?:\n|$)"])

    # 4. Costs (Expense Ratio)
    # Refined regex for Direct/Regular
    expense_ratio_direct = extract_field(text, [
        r"Expense Ratio.*Direct.*[:\-\u2013]?\s*(\d+\.?\d*\s*%)",
        r"Direct.*Expense Ratio.*[:\-\u2013]?\s*(\d+\.?\d*\s*%)",
        r"Direct Plan\s*(\d+\.?\d*\s*%)"
    ])
    expense_ratio_regular = extract_field(text, [
        r"Expense Ratio.*Regular.*[:\-\u2013]?\s*(\d+\.?\d*\s*%)",
        r"Regular.*Expense Ratio.*[:\-\u2013]?\s*(\d+\.?\d*\s*%)",
        r"Regular Plan\s*(\d+\.?\d*\s*%)"
    ])
    
    # 5. Portfolio Holdings
    # Pattern: Name followed by Number%. 
    # Issue: "HDFC Bank Limited Banks8.02%" -> Name="HDFC Bank Limited Banks", Alloc="8.02"
    # We want to remove the sector from the end of the name if possible, but that's hard without a sector list.
    # However, we can split by " " and if the last word is a known sector (Banks, Software, Finance), remove it.
    # For now, we will regex slightly cleaner.
    top_holdings = []
    # Find lines ending in a percentage
    holding_matches = re.finditer(r"^\s*([A-Za-z\s\.\(\)&0-9\-]+?)\s*(\d+\.\d+)\s*%\s*$", text, re.MULTILINE)
    
    seen_holdings = set()
    for match in holding_matches:
        raw_name = match.group(1).strip()
        alloc = match.group(2)
        
        # Heuristic to clean name: 
        # If name ends with "Banks", "Finance", "Software", "Petroleum", etc (Common sectors), cut it?
        # A simpler way is to limit length or chars. 
        if len(raw_name) > 3 and "Total" not in raw_name and "Grand" not in raw_name:
            if raw_name not in seen_holdings:
                 top_holdings.append({"name": raw_name, "allocation": f"{alloc}%"})
                 seen_holdings.add(raw_name)
        
        if len(top_holdings) >= 10:
            break

    # 6. Size
    net_assets = extract_field(text, [
        r"Net Assets\s*[:\-\u2013]?\s*([0-9,]+\.?\d*\s*(?:Cr|Crores?|Lakhs?))",
        r"AUM\s*.*?([0-9,]+\.?\d*\s*(?:Cr|Crores?))",
        r"([0-9,]+\.?\d*\s*Crores)" # Generic capture if labelled loosely
    ])

    # 7. Liquidity/Exit
    exit_load = extract_field(text, [
        r"Exit Load\s*[:\-\u2013]?\s*([\s\S]{1,200}?)(?:\n\n|\.|In respect|For units|$)"
    ])
    if exit_load: exit_load = clean_text(exit_load)
    
    min_inv = extract_field(text, [
        r"Minimum Investment\s*[:\-\u2013]?\s*([A-Za-z0-9,\s]+?)(?:\n|Initial|$)",
        r"Min\. Investment\s*[:\-\u2013]?\s*([0-9,]+)"
    ])
    if min_inv: min_inv = clean_text(min_inv)

    # 8. Governance
    fund_manager = extract_field(text, [
        r"Fund Manager\s*[:\-\u2013]?\s*([A-Za-z\s,\.]+)(?:\n|$|Date)",
        r"Mr\.\s+[A-Za-z\s]+", # Capture name starting with Mr.
        r"Ms\.\s+[A-Za-z\s]+"
    ])
    
    insider_holdings = extract_field(text, [
        r"Skin in the Game\s*.*?([0-9,]+\.?\d*\s*(?:Cr|Crores?))",
        r"Insiders.*?amounts to\s*([0-9,]+\.?\d*\s*(?:Cr|Crores?))"
    ])

    return FactSheetAnalysis(
        fund_name=fund_name,
        investment_objective=investment_objective,
        scheme_type=scheme_type,
        inception_date=inception_date,
        benchmark=benchmark,
        nav=nav,
        cagr=cagr,
        risk_metrics=risk_metrics,
        riskometer=riskometer,
        expense_ratio=None, # Deprecated in favor of specific
        expense_ratio_direct=expense_ratio_direct,
        expense_ratio_regular=expense_ratio_regular,
        top_holdings=top_holdings,
        sector_allocation=[],
        turnover_ratio=None,
        net_assets=net_assets,
        min_investment_lumpsum=min_inv,
        exit_load=exit_load,
        fund_manager=fund_manager,
        insider_holdings=insider_holdings,
        raw_text=text[:3000]
    )
