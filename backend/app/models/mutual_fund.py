from sqlalchemy import Column, String, Numeric, DateTime, func
from app.db.base_class import Base

class MutualFund(Base):
    __tablename__ = "mutual_funds"
    scheme_code = Column(String, primary_key=True, index=True)
    scheme_name = Column(String, index=True)
    nav = Column(Numeric(10, 4))
    nav_date = Column(String) # The data from AMFI is a string like '05-Jul-2024'
    fund_house = Column(String)
    category = Column(String)
    sub_category = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
