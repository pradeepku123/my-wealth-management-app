"""Background task scheduler for NAV updates."""
import asyncio
import logging
from datetime import datetime, time
from app.database import get_db_connection
import requests

logger = logging.getLogger(__name__)

async def update_all_nav_data():
    """Update NAV data for all mutual funds in database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all unique scheme codes from mutual_funds table
        cursor.execute("SELECT DISTINCT scheme_code FROM mutual_funds")
        scheme_codes = [row['scheme_code'] for row in cursor.fetchall()]
        
        if not scheme_codes:
            logger.info("No mutual funds found to update")
            cursor.close()
            conn.close()
            return
        
        # Fetch NAV data from AMFI
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=30)
        
        if response.status_code != 200:
            logger.error("Failed to fetch NAV data from AMFI")
            cursor.close()
            conn.close()
            return
        
        lines = response.text.strip().split('\n')
        updated_count = 0
        
        for line in lines[1:]:
            if ';' in line:
                parts = line.split(';')
                if len(parts) >= 6 and parts[0] in scheme_codes:
                    try:
                        scheme_name = parts[3]
                        category, sub_category = classify_fund(scheme_name)
                        
                        cursor.execute(
                            """
                            UPDATE mutual_funds SET 
                                scheme_name = %s,
                                nav = %s,
                                nav_date = %s,
                                fund_house = %s,
                                category = %s,
                                sub_category = %s,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE scheme_code = %s
                            """,
                            (scheme_name, float(parts[4]), parts[5], parts[2] if len(parts) > 2 else "Unknown", category, sub_category, parts[0])
                        )
                        updated_count += 1
                    except ValueError:
                        continue
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Updated NAV data for {updated_count} mutual funds")
        
    except Exception as e:
        logger.error(f"NAV update error: {str(e)}")

async def daily_nav_scheduler():
    """Run NAV update daily at midnight."""
    while True:
        now = datetime.now()
        # Calculate seconds until next midnight
        midnight = datetime.combine(now.date(), time(0, 0)) 
        if now.time() >= time(0, 0):
            # If it's already past midnight, schedule for next day
            midnight = midnight.replace(day=midnight.day + 1)
        
        seconds_until_midnight = (midnight - now).total_seconds()
        
        logger.info(f"Next NAV update scheduled in {seconds_until_midnight/3600:.1f} hours")
        await asyncio.sleep(seconds_until_midnight)
        
        logger.info("Starting daily NAV update...")
        await update_all_nav_data()

def classify_fund(scheme_name):
    """Classify mutual fund by category and sub-category based on scheme name."""
    name_upper = scheme_name.upper()
    
    # Determine category (Equity or Debt)
    if any(keyword in name_upper for keyword in ['EQUITY', 'BLUECHIP', 'LARGECAP', 'MIDCAP', 'SMALLCAP', 'MULTICAP', 'FLEXICAP', 'FOCUSED']):
        category = 'Equity'
    elif any(keyword in name_upper for keyword in ['DEBT', 'BOND', 'GILT', 'LIQUID', 'ULTRA SHORT', 'SHORT TERM', 'MEDIUM TERM', 'LONG TERM', 'CORPORATE BOND']):
        category = 'Debt'
    else:
        category = 'Other'
    
    # Determine sub-category for Equity funds
    if category == 'Equity':
        if any(keyword in name_upper for keyword in ['LARGE CAP', 'LARGECAP', 'BLUECHIP', 'TOP 100', 'NIFTY 50']):
            sub_category = 'Large Cap'
        elif any(keyword in name_upper for keyword in ['MID CAP', 'MIDCAP', 'MID-CAP']):
            sub_category = 'Mid Cap'
        elif any(keyword in name_upper for keyword in ['SMALL CAP', 'SMALLCAP', 'SMALL-CAP']):
            sub_category = 'Small Cap'
        elif any(keyword in name_upper for keyword in ['MULTI CAP', 'MULTICAP', 'MULTI-CAP']):
            sub_category = 'Multi Cap'
        elif any(keyword in name_upper for keyword in ['FLEXI CAP', 'FLEXICAP', 'FLEXI-CAP']):
            sub_category = 'Flexi Cap'
        else:
            sub_category = 'Other Equity'
    elif category == 'Debt':
        if any(keyword in name_upper for keyword in ['LIQUID', 'OVERNIGHT']):
            sub_category = 'Liquid'
        elif any(keyword in name_upper for keyword in ['ULTRA SHORT', 'SHORT TERM']):
            sub_category = 'Short Term'
        elif any(keyword in name_upper for keyword in ['MEDIUM TERM', 'INTERMEDIATE']):
            sub_category = 'Medium Term'
        elif any(keyword in name_upper for keyword in ['LONG TERM', 'GILT']):
            sub_category = 'Long Term'
        else:
            sub_category = 'Other Debt'
    else:
        sub_category = 'Other'
    
    return category, sub_category