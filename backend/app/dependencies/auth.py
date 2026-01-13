# Authentication Dependency Module
# Phase 2.3: JWT Authentication
# Task ID: T004-T009

from dataclasses import dataclass
from typing import Annotated

import jwt
from fastapi import Header, HTTPException, status

from ..config import get_settings


@dataclass
class AuthenticatedUser:
    """
    Represents an authenticated user extracted from JWT.

    Implements FR-004: Extract user identity (user_id, email) from JWT payload.
    Task ID: T004
    """
    user_id: str
    email: str


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None
) -> AuthenticatedUser:
    """
    FastAPI dependency for JWT authentication.

    Implements:
    - FR-001: Require valid JWT token in Authorization header
    - FR-002: Validate JWT signature using shared secret
    - FR-003: Validate JWT expiration
    - FR-004: Extract user identity from JWT payload
    - FR-005: Reject missing/invalid tokens with 401
    - FR-012/FR-013: Return consistent error responses

    Task ID: T005-T009

    Args:
        authorization: Authorization header value (Bearer <token>)

    Returns:
        AuthenticatedUser with user_id and email from JWT

    Raises:
        HTTPException 401: Missing, invalid, or expired token
    """
    settings = get_settings()

    # T005: Check for Authorization header
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # T005: Validate Bearer format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    try:
        # T006: Verify JWT signature
        # T007: Validate expiration (handled by PyJWT)
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        # T008: Extract required claims
        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing required claims",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthenticatedUser(user_id=user_id, email=email)

    except jwt.ExpiredSignatureError:
        # T009: Handle expired token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        # T009: Handle invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
