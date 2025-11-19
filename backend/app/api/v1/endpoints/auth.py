import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.core.security import create_access_token, get_password_hash
from app.response_models import APIResponse, success_response
from app.services.user_service import authenticate_user


router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/login/access-token", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    return {
        "access_token": create_access_token(subject=user.id),
        "token_type": "bearer",
    }


@router.post("/forgot-password", response_model=APIResponse, responses={
    404: {"description": "User not found"},
})
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(deps.get_db)):
    """
    Initiate password reset process.
    
    Validates that the user exists and would typically send reset instructions.
    In this demo version, it only confirms the user exists.
    """
    user = crud.user.get_by_email(db, email=request.user_id) # Assuming user_id is the email
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return success_response(
        message=f"Password reset instructions sent to {request.user_id}"
    )


@router.post("/reset-password", response_model=APIResponse, responses={
    404: {"description": "User not found"},
})
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(deps.get_db)):
    """
    Reset user password.
    """
    user = crud.user.get_by_email(db, email=request.user_id) # Assuming user_id is the email
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    hashed_password = get_password_hash(request.new_password)
    update_data = {"hashed_password": hashed_password}
    crud.user.update(db, db_obj=user, obj_in=update_data)
    
    return success_response(
        message="Password reset successfully"
    )


@router.post("/register", response_model=APIResponse, responses={
    400: {"description": "User already exists"},
})
def register_user(user_data: schemas.UserRegistration, db: Session = Depends(deps.get_db)):
    """
    Register a new user.
    """
    user = crud.user.get_by_email(db, email=user_data.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user_in_create = schemas.UserCreate(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name
    )
    crud.user.create(db, obj_in=user_in_create)
    
    return success_response(
        message="User registered successfully"
    )

@router.get("/user-info", response_model=APIResponse)
def get_user_info(user_id: str, db: Session = Depends(deps.get_db)):
    """Get user information by user ID (email)."""
    user = crud.user.get_by_email(db, email=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Assuming role is not part of the User model and can be hardcoded or omitted
    return success_response(
        data={
            "user_id": user.email,
            "full_name": user.full_name,
            "role": "user", 
            "email": user.email
        },
        message="User information retrieved successfully"
    )