from fastapi import APIRouter
from app.api.v1.endpoints import auth, portfolio, admin
from app.routers import market

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(market.router, prefix="/market", tags=["market"])

