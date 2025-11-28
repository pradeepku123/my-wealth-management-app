from typing import TYPE_CHECKING

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_superuser = Column(Boolean(), default=False)
    role = Column(String, default='user')
    investments = relationship("Investment", back_populates="owner")
    sip_estimations = relationship("SIPEstimation", back_populates="owner")
    goals = relationship("Goal", back_populates="owner")
