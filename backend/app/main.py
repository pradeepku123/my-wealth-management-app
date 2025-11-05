"""Main FastAPI application module."""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from app.auth import authenticate_user, create_access_token, Token, UserLogin
from psycopg2.extras import RealDictCursor
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


@app.post("/auth/forgot-password")
def forgot_password(user_data: dict):
    """Forgot password endpoint."""
    user_id = user_data.get("user_id")
    
    # Check if user exists
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # In a real app, you would send an email here
    # For demo purposes, we'll just return a success message
    return {"message": f"Password reset instructions sent to {user_id}"}


@app.post("/auth/reset-password")
def reset_password(reset_data: dict):
    """Reset password endpoint."""
    user_id = reset_data.get("user_id")
    new_password = reset_data.get("new_password")
    
    if not user_id or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID and new password are required"
        )
    
    # Update password in database
    conn = psycopg2.connect(
        host="db",
        database="wealth_db",
        user="postgres",
        password="examplepassword",
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    
    # Check if user exists and update password
    cursor.execute(
        "UPDATE users SET password = %s WHERE user_id = %s RETURNING user_id",
        (new_password, user_id)
    )
    updated_user = cursor.fetchone()
    
    conn.commit()
    cursor.close()
    conn.close()
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "Password reset successfully"}
