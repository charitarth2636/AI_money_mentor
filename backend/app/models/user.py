from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    full_name: str
    hashed_password: str
    profile_completed: bool = False

class UserResponse(BaseModel):
    email: EmailStr
    full_name: str
    profile_completed: bool
