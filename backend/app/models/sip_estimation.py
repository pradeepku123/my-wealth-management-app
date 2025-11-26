from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class SIPEstimation(Base):
    __tablename__ = "sip_estimations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    sip_type = Column(String)  # 'Monthly' or 'Yearly'
    amount = Column(Numeric(10, 2))
    return_rate = Column(Numeric(5, 2))
    time_period = Column(Integer)
    total_invested = Column(Numeric(15, 2))
    estimated_returns = Column(Numeric(15, 2))
    total_value = Column(Numeric(15, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="sip_estimations")
