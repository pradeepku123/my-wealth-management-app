from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.security import get_password_hash, verify_password


def get_user(db: Session, user_id: int):
    return crud.user.get(db=db, id=user_id)


def get_user_by_email(db: Session, email: str):
    return crud.user.get_by_email(db=db, email=email)


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return crud.user.get_multi(db, skip=skip, limit=limit)


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
