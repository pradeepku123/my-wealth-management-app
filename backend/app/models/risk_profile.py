from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class RiskProfile(Base):
    __tablename__ = "risk_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_category = Column(String, nullable=False)
    answers = Column(JSON, nullable=False)  # Store answers as JSON

    owner = relationship("User", back_populates="risk_profile")
