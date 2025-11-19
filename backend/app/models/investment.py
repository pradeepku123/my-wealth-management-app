from sqlalchemy import Column, Integer, String, Numeric
from app.db.base_class import Base

class Investment(Base):
    __tablename__ = "investments"
    id = Column(Integer, primary_key=True, index=True)
    investment_type = Column(String, index=True)
    fund_name = Column(String)
    invested_amount = Column(Numeric(10, 2))
    current_value = Column(Numeric(10, 2))
