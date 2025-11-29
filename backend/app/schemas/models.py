"""Pydantic models for request/response validation."""
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class UserLogin(BaseModel):
    user_id: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "admin",
                "password": "password123"
            }
        }


class Token(BaseModel):
    access_token: str
    token_type: str


class ForgotPasswordRequest(BaseModel):
    user_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "admin"
            }
        }


class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "admin",
                "new_password": "newpassword123"
            }
        }


class InvestmentCreate(BaseModel):
    investment_type: str
    fund_name: str
    invested_amount: Decimal
    current_value: Decimal
    
    class Config:
        json_schema_extra = {
            "example": {
                "investment_type": "mutual_fund",
                "fund_name": "SBI Bluechip Fund - Direct Plan - Growth",
                "invested_amount": 50000.00,
                "current_value": 55000.00
            }
        }


class InvestmentUpdate(BaseModel):
    investment_type: str
    fund_name: str
    invested_amount: Decimal
    current_value: Decimal


class Investment(BaseModel):
    id: int
    investment_type: str
    fund_name: str
    invested_amount: Decimal
    current_value: Decimal
    owner_id: int

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str


class PortfolioSummary(BaseModel):
    total_invested: Decimal
    total_current: Decimal
    total_returns: Decimal
    return_percentage: float


class AssetBreakdown(BaseModel):
    investment_type: str
    total_invested: Decimal
    total_current: Decimal
    total_returns: Decimal
    return_percentage: float


class MutualFund(BaseModel):
    scheme_code: str
    scheme_name: str
    nav: float
    nav_date: str # The data from AMFI is a string like '05-Jul-2024'
    fund_house: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    rolling_return: Optional[float] = None

    class Config:
        from_attributes = True

class MutualFundCreate(BaseModel):
    scheme_code: str
    scheme_name: str
    nav: float
    nav_date: str
    fund_house: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None



class UserRegistration(BaseModel):
    user_id: str
    password: str
    full_name: str
    email: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "john_doe",
                "password": "securepassword123",
                "full_name": "John Doe",
                "email": "john.doe@example.com"
            }
        }


class HealthCheck(BaseModel):
    status: str
    message: Optional[str] = None