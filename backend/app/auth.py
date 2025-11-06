"""Authentication module."""
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from jose import JWTError, jwt
from app.database import get_db_connection

SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def authenticate_user(user_id: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT user_id, password, full_name FROM users WHERE user_id = %s",
        (user_id,)
    )
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user or user["password"] != password:
        return False
    return dict(user)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)