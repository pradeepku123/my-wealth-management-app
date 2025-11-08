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
    
    try:
        cursor.execute(
            "SELECT user_id, password, full_name, role FROM users WHERE user_id = %s",
            (user_id,)
        )
    except Exception:
        # Fallback if role column doesn't exist
        cursor.execute(
            "SELECT user_id, password, full_name FROM users WHERE user_id = %s",
            (user_id,)
        )
    
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or user["password"] != password:
        return False
    
    user_dict = dict(user)
    # Set role based on user_id if not in database
    if "role" not in user_dict:
        user_dict["role"] = "admin" if user_id == "admin" else "user"
    
    return user_dict

def create_access_token(data: dict, role: str = "user"):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "role": role})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)