import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.api import deps
from app.core.security import create_access_token, get_password_hash, verify_password
from app.schemas.response import APIResponse
from app.utils.response import success_response
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
    # Use the user's email as the token subject so frontend can call user-info by email
    return {
        "access_token": create_access_token(subject=user.id, role=user.role, full_name=user.full_name, email=user.email),
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
def get_user_info(user_id: int, db: Session = Depends(deps.get_db)):
    """Get user information by user ID."""
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Assuming role is not part of the User model and can be hardcoded or omitted
    return success_response(
        data={
            "user_id": user.id,
            "full_name": user.full_name,
            "role": user.role, 
            "email": user.email
        },
        message="User information retrieved successfully"
    )

@router.put("/profile", response_model=APIResponse)
def update_user_profile(
    profile_data: schemas.UserProfileUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Update user profile."""
    user = crud.user.get(db, id=current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = profile_data.dict(exclude_unset=True)
    if "email" in user_data:
        # Check if email is already taken by another user
        existing_user = crud.user.get_by_email(db, email=user_data["email"])
        if existing_user and existing_user.id != user.id:
            raise HTTPException(status_code=400, detail="Email already registered")

    updated_user = crud.user.update(db, db_obj=user, obj_in=user_data)
    
    return success_response(
        data={
            "user_id": updated_user.id,
            "full_name": updated_user.full_name,
            "role": updated_user.role,
            "email": updated_user.email
        },
        message="Profile updated successfully"
    )

@router.post("/change-password", response_model=APIResponse)
def change_password(
    password_data: schemas.UserPasswordUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """Change user password."""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    hashed_password = get_password_hash(password_data.new_password)
    # We can't use crud.user.update directly easily for just password without a schema, 
    # but we can update the object directly since we have the ORM object
    current_user.hashed_password = hashed_password
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return success_response(message="Password updated successfully")