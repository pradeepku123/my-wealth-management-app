"""Main FastAPI application module."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_database, get_db_connection
from app.routers import auth, portfolio, market, admin
from app.models import HealthCheck, MessageResponse
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Wealth Management API",
    description="""## Personal Wealth Management Application API
    
    This API provides comprehensive wealth management functionality including:
    
    * **Authentication** - User login and password management
    * **Portfolio Management** - Investment tracking and analysis
    * **Market Data** - Real-time mutual fund NAV data from AMFI
    
    ### Features
    - JWT-based authentication
    - Multi-asset portfolio tracking (Mutual Funds, EPF, PPF, FD, MIS, NPS)
    - Real-time market data integration
    - Portfolio analytics and breakdowns
    
    ### Base URL
    - Development: `http://localhost:8000`
    - Production: Your deployed URL
    """,
    version="1.0.0",
    contact={
        "name": "Wealth Management Team",
        "email": "support@wealthmanagement.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "authentication",
            "description": "User authentication and password management operations"
        },
        {
            "name": "portfolio",
            "description": "Investment portfolio management and analytics"
        },
        {
            "name": "market",
            "description": "Market data and mutual fund information"
        },
        {
            "name": "health",
            "description": "System health and status checks"
        },
        {
            "name": "database-admin",
            "description": "Database administration and table viewing"
        }
    ]
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(portfolio.router)
app.include_router(market.router)
app.include_router(admin.router)


@app.options("/{path:path}", response_model=MessageResponse)
def options_handler(path: str):
    """Handle CORS preflight requests."""
    return {"message": "OK"}


@app.get("/", response_model=MessageResponse, tags=["health"])
def read_root():
    """Root endpoint returning a welcome message."""
    return {"message": "Welcome to Wealth Management App"}


@app.get("/health/db", response_model=HealthCheck, tags=["health"], responses={
    503: {"description": "Database unavailable"}
})
def check_db():
    """Check database connection health."""
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {"status": "error", "message": str(e)}
