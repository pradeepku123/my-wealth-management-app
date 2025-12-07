from fastapi import APIRouter
from app.api.v1.endpoints import auth, portfolio, admin, sip, test_data, analytics, goals, recommendations, swp, budget, risk_profile, funds
from app.routers import market

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(sip.router, prefix="/sip", tags=["sip"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(test_data.router, prefix="/test-data", tags=["test-data"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(swp.router, prefix="/swp", tags=["swp"])
api_router.include_router(budget.router, prefix="/budget", tags=["budget"])
api_router.include_router(risk_profile.router, prefix="/risk-profile", tags=["risk-profile"])
api_router.include_router(funds.router, prefix="/funds", tags=["funds"])


