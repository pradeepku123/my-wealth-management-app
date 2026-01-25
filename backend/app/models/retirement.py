from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class RetirementPlan(Base):
    __tablename__ = "retirement_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    current_age = Column(Integer, default=30) # inferred, maybe not needed if input starts at 60? No, usually start_age is retirement age. 
    # Current input has startAge (60) and endAge (100).
    # Wait, the component says "startAge: number = 60;" and "endAge: number = 100;".
    # It also has "totalCorpus".
    # I should stick to what is in the component.
    
    start_age = Column(Integer)
    end_age = Column(Integer)
    inflation_rate = Column(Float)
    total_corpus = Column(Float) # The user overrides this or it's calculated. Let's save it.
    
    # JSON columns for lists
    funds = Column(JSON) 
    rebalancing_rules = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="retirement_plans")
