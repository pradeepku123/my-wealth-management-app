from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Investment(Base):
    __tablename__ = "investments"
    id = Column(Integer, primary_key=True, index=True)
    investment_type = Column(String, index=True)
    fund_name = Column(String)
    invested_amount = Column(Numeric(18, 2))
    current_value = Column(Numeric(18, 2))
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="investments")
    goal_associations = relationship("GoalInvestment", back_populates="investment")
