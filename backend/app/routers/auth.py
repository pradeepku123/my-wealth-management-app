"""Authentication routes."""
from fastapi import APIRouter, HTTPException, status
from app.models import UserLogin, Token, ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
from app.auth import authenticate_user, create_access_token
from app.database import get_db_connection
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=Token, responses={
    401: {"description": "Invalid credentials"},
    500: {"description": "Internal server error"}
})
def login(user_credentials: UserLogin):
    """
    Authenticate user and return JWT access token.
    
    Validates user credentials and returns a JWT token for authenticated requests.
    
    **Default Users:**
    - user_id: `admin`, password: `password123`
    - user_id: `user1`, password: `mypassword`
    
    **Request Body:**
    - **user_id**: User identifier
    - **password**: User password
    
    **Response:**
    - **access_token**: JWT token for authentication
    - **token_type**: Always "bearer"
    """
    try:
        user = authenticate_user(user_credentials.user_id, user_credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect user ID or password"
            )
        access_token = create_access_token(data={"sub": user["user_id"]})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )


@router.post("/forgot-password", response_model=MessageResponse, responses={
    404: {"description": "User not found"},
    500: {"description": "Internal server error"}
})
def forgot_password(request: ForgotPasswordRequest):
    """
    Initiate password reset process.
    
    Validates that the user exists and would typically send reset instructions.
    In this demo version, it only confirms the user exists.
    
    **Request Body:**
    - **user_id**: User identifier to reset password for
    
    **Response:**
    - Confirmation message that reset instructions were sent
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (request.user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {"message": f"Password reset instructions sent to {request.user_id}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset service unavailable"
        )


@router.post("/reset-password", response_model=MessageResponse, responses={
    404: {"description": "User not found"},
    500: {"description": "Internal server error"}
})
def reset_password(request: ResetPasswordRequest):
    """
    Reset user password.
    
    Updates the user's password in the database.
    
    **Request Body:**
    - **user_id**: User identifier
    - **new_password**: New password to set
    
    **Response:**
    - Confirmation message that password was reset successfully
    
    **Note:** In production, this would require proper token validation.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET password = %s WHERE user_id = %s RETURNING user_id",
            (request.new_password, request.user_id)
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset service unavailable"
        )