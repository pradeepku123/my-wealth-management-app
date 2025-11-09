"""Main FastAPI application module."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_database, get_db_connection
from app.routers import auth, portfolio, admin
from app.models import HealthCheck, MessageResponse
from app.response_models import APIResponse, success_response
from app.exception_handlers import http_exception_handler, general_exception_handler
from fastapi import HTTPException
from app.scheduler import update_all_nav_data, daily_nav_scheduler
import logging
import asyncio

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Wealth Management API",
    description="""## Personal Wealth Management Application API
    
    This API provides comprehensive wealth management functionality with **standardized response format**.
    
    ### API Response Format
    All endpoints return responses in this standardized format:
    ```json
    {
        "success": true,
        "message": "Operation completed successfully",
        "data": { /* Response payload */ },
        "errors": null,
        "timestamp": "2024-01-15T10:30:00Z"
    }
    ```
    
    ### Core Features
    * **Authentication** - JWT-based login and password management
    * **Portfolio Management** - Multi-asset investment tracking
    * **Market Data** - Real-time mutual fund NAV from AMFI
    * **Database Admin** - Complete database management interface
    
    ### Supported Assets
    - Mutual Funds, EPF, PPF, Fixed Deposits, MIS, NPS
    
    ### Base URLs
    - Development: `http://localhost:8000`
    - GitHub Codespaces: `https://{codespace-name}-8000.app.github.dev`
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
    # Update NAV data on startup
    asyncio.create_task(update_all_nav_data())
    # Start daily scheduler
    asyncio.create_task(daily_nav_scheduler())

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(auth.router)
app.include_router(portfolio.router)

app.include_router(admin.router)


@app.options("/{path:path}", response_model=MessageResponse)
def options_handler(path: str):
    """Handle CORS preflight requests."""
    return {"message": "OK"}


@app.get("/", response_model=APIResponse, tags=["health"])
def read_root():
    """Root endpoint with API information."""
    return success_response(
        data={
            "api_name": "Wealth Management API",
            "version": "1.0.0",
            "docs_url": "/docs",
            "redoc_url": "/redoc"
        },
        message="Welcome to Wealth Management API"
    )


@app.get("/health/db", response_model=APIResponse, tags=["health"], responses={
    503: {"description": "Database unavailable"}
})
def check_db():
    """Check database connection health."""
    try:
        conn = get_db_connection()
        conn.close()
        return success_response(
            data={"status": "connected", "database": "PostgreSQL"},
            message="Database connection healthy"
        )
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return success_response(
            data={"status": "error", "error": str(e)},
            message="Database connection failed"
        )
