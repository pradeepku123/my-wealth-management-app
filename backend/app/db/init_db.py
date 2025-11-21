from sqlalchemy.orm import Session
from sqlalchemy import text
from app import crud, schemas
from app.core.config import settings
from app.db.session import engine
from app.db.base_class import Base


def init_db(db: Session) -> None:
    # Drop items table if it exists
    db.execute(text("DROP TABLE IF EXISTS items CASCADE;"))
    # Drop and re-create all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    user = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            role="admin",
        )
        user = crud.user.create(db, obj_in=user_in)
