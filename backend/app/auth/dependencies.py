"""
auth/dependencies.py

FastAPI dependency that protects routes. Add `current_user: User =
Depends(get_current_user)` to any route to require a valid JWT token.

This is the equivalent of Spring Security's JwtAuthenticationFilter,
but implemented as a per-route dependency instead of a global filter.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.auth.jwt_handler import decode_access_token

# tokenUrl just tells FastAPI's docs UI where login happens; we don't
# use OAuth2 form login, we accept JSON on /api/auth/login.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user
