"""Main FastAPI application module."""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from app.auth import authenticate_user, create_access_token, Token, UserLogin
from app.database import init_database

app = FastAPI()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """
    Root endpoint returning a welcome message.
    """
    return {"message": "Welcome to wealth Management App"}


@app.get("/health/db")
def check_db():
    """Check database connection."""
    try:
        conn = psycopg2.connect(
            host="db",
            database="wealth_db",
            user="postgres",
            password="examplepassword"
        )
        conn.close()
        return {"status": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/auth/login", response_model=Token)
def login(user_credentials: UserLogin):
    """Login endpoint."""
    user = authenticate_user(user_credentials.user_id, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect user ID or password"
        )
    access_token = create_access_token(data={"sub": user["user_id"]})
    return {"access_token": access_token, "token_type": "bearer"}
