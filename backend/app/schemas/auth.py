"""
schemas/auth.py

Pydantic schemas for authentication requests/responses.
These are what the API actually accepts/returns — never the raw
SQLAlchemy model (so we never accidentally leak password_hash, etc).
"""

from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.STAFF


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole

    class Config:
        from_attributes = True  # allows creating this from a SQLAlchemy object


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
