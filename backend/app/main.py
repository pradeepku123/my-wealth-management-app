from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.init_db import init_db
from app.scheduler import daily_nav_scheduler

Base.metadata.create_all(bind=engine)

# Create initial data
db = SessionLocal()
init_db(db)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background task
    asyncio.create_task(daily_nav_scheduler())
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.PROJECT_DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the Wealth Management API"}

app.include_router(api_router, prefix=settings.API_V1_STR)