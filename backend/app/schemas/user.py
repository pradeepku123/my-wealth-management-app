from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    email: str
    full_name: str | None = None
    is_superuser: bool = False
    role: str = 'user'


class UserCreate(UserBase):
    password: str


class UserUpdate(UserBase):
    pass


class UserInDBBase(UserBase):
    id: int
    email: str
    full_name: str | None = None
    is_superuser: bool
    role: str

    class Config:
        orm_mode = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str


class OAuth2PasswordRequestForm(BaseModel):
    username: str
    password: str


class TokenPayload(BaseModel):
    sub: Optional[int] = None