"""Background task scheduler for NAV updates."""
import asyncio
import logging
from datetime import datetime, time
import requests
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.mutual_fund import MutualFund
from app.crud import crud_mutual_fund
from app.schemas.models import MutualFundCreate
from app.utils.fund_classifier import classify_fund

logger = logging.getLogger(__name__)

async def update_all_nav_data(db: Session):
    """Update NAV data for all mutual funds in database."""
    try:
        scheme_codes_result = db.query(MutualFund.scheme_code).distinct().all()
        scheme_codes = [row.scheme_code for row in scheme_codes_result]
        
        if not scheme_codes:
            logger.info("No mutual funds found to update")
            return
        
        # Fetch NAV data from AMFI
        url = "https://www.amfiindia.com/spages/NAVAll.txt"
        response = requests.get(url, timeout=30)
        
        if response.status_code != 200:
            logger.error("Failed to fetch NAV data from AMFI")
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
                        
                        fund_in = MutualFundCreate(
                            scheme_code=parts[0],
                            scheme_name=scheme_name,
                            nav=float(parts[4]),
                            nav_date=parts[5],
                            fund_house=parts[2] if len(parts) > 2 else "Unknown",
                            category=category,
                            sub_category=sub_category
                        )
                        crud_mutual_fund.mutual_fund.upsert(db, obj_in=fund_in)
                        updated_count += 1
                    except ValueError:
                        continue
        
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
        with SessionLocal() as db:
            await update_all_nav_data(db)