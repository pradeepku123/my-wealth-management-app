from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class SWPEstimation(Base):
    __tablename__ = "swp_estimations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    total_investment = Column(Numeric(15, 2))
    withdrawal_per_month = Column(Numeric(10, 2))
    return_rate = Column(Numeric(5, 2))
    time_period = Column(Integer)
    total_withdrawn = Column(Numeric(15, 2))
    final_value = Column(Numeric(15, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="swp_estimations")
