from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    target_amount = Column(Numeric(18, 2))
    target_date = Column(Date)
    monthly_sip_amount = Column(Numeric(18, 2), default=0)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="goals")
    
    # Use the association object
    investment_associations = relationship("GoalInvestment", back_populates="goal", cascade="all, delete-orphan")
