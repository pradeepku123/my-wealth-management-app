from sqlalchemy import Column, Integer, Numeric, ForeignKey
from app.db.base_class import Base
from sqlalchemy.orm import relationship

class GoalInvestment(Base):
    __tablename__ = "goal_investments_association"
    
    goal_id = Column(Integer, ForeignKey("goals.id"), primary_key=True)
    investment_id = Column(Integer, ForeignKey("investments.id"), primary_key=True)
    allocated_amount = Column(Numeric(18, 2), default=0)
    
    goal = relationship("Goal", back_populates="investment_associations")
    investment = relationship("Investment", back_populates="goal_associations")
